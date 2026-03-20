import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Map Stripe price IDs to subscription plans
// ---------------------------------------------------------------------------
function planFromPriceId(priceId: string): "pro" | "max" | null {
  console.log("[webhook] Comparing priceId:", priceId);
  console.log("[webhook] PRO_PRICE_ID:", process.env.STRIPE_PRO_PRICE_ID);
  console.log("[webhook] MAX_PRICE_ID:", process.env.STRIPE_MAX_PRICE_ID);
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_MAX_PRICE_ID) return "max";
  return null;
}

// ---------------------------------------------------------------------------
// POST /api/stripe/webhook
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  // Verify webhook signature if secret is configured
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[stripe/webhook] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }
  } else {
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }
  }

  console.log("[webhook] Event type:", event.type);

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // ─── Checkout completed ──────────────────────────────────────────
      case "checkout.session.completed": {
        const sessionFromEvent = event.data.object as Stripe.Checkout.Session;

        // Always retrieve the full session from Stripe to get metadata
        const session = await stripe.checkout.sessions.retrieve(
          sessionFromEvent.id,
          { expand: ["subscription"] }
        );

        console.log("[webhook] Session ID:", session.id);
        console.log("[webhook] Session metadata:", JSON.stringify(session.metadata));
        console.log("[webhook] Session customer:", session.customer);
        console.log("[webhook] Session subscription:", session.subscription);

        // Try to get user ID from metadata
        let userId = session.metadata?.supabase_user_id;

        // Fallback: look up user by stripe_customer_id
        if (!userId) {
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;

          console.log("[webhook] No metadata userId, looking up by customer:", customerId);

          if (customerId) {
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("id")
              .eq("stripe_customer_id", customerId)
              .single();

            if (profile) {
              userId = profile.id;
              console.log("[webhook] Found user by customer ID:", userId);
            }
          }
        }

        // Fallback 2: look up by email
        if (!userId) {
          const customerEmail = session.customer_details?.email;
          console.log("[webhook] Trying email lookup:", customerEmail);

          if (customerEmail) {
            const { data: userData } = await supabase.auth.admin.listUsers();
            const matchingUser = userData?.users?.find(
              (u) => u.email === customerEmail
            );
            if (matchingUser) {
              userId = matchingUser.id;
              console.log("[webhook] Found user by email:", userId);
            }
          }
        }

        if (!userId) {
          console.error("[webhook] Could not find user for session:", session.id);
          break;
        }

        // Get subscription details
        let subscriptionId: string | undefined;
        let priceId: string | undefined;

        if (typeof session.subscription === "string") {
          subscriptionId = session.subscription;
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          priceId = sub.items.data[0]?.price?.id;
        } else if (session.subscription && typeof session.subscription === "object") {
          const sub = session.subscription as Stripe.Subscription;
          subscriptionId = sub.id;
          priceId = sub.items.data[0]?.price?.id;
        }

        console.log("[webhook] subscriptionId:", subscriptionId);
        console.log("[webhook] priceId:", priceId);

        if (!subscriptionId || !priceId) {
          console.error("[webhook] Missing subscription or price ID");
          break;
        }

        const plan = planFromPriceId(priceId);
        console.log("[webhook] Determined plan:", plan);

        if (!plan) {
          console.error("[webhook] Unknown price ID:", priceId);
          break;
        }

        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        // Use upsert so we create the profile row if it doesn't exist yet
        const { error: upsertError } = await supabase
          .from("user_profiles")
          .upsert(
            {
              id: userId,
              subscription_plan: plan,
              subscription_status: "active",
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
            },
            { onConflict: "id" }
          );

        if (upsertError) {
          console.error("[webhook] Supabase upsert error:", upsertError);
        } else {
          console.log(
            `[webhook] SUCCESS: User ${userId} subscribed to ${plan} (sub: ${subscriptionId})`
          );
        }
        break;
      }

      // ─── Subscription updated (plan change) ─────────────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? planFromPriceId(priceId) : null;

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          console.warn("[webhook] No profile found for customer:", customerId);
          break;
        }

        const status = subscription.status;
        const mappedStatus =
          status === "active" || status === "trialing"
            ? "active"
            : status === "past_due"
              ? "past_due"
              : "canceled";

        await supabase
          .from("user_profiles")
          .update({
            subscription_plan: plan ?? "free",
            subscription_status: mappedStatus,
            stripe_subscription_id: subscription.id,
          })
          .eq("id", profile.id);

        console.log(
          `[webhook] Subscription updated for user ${profile.id}: plan=${plan}, status=${mappedStatus}`
        );
        break;
      }

      // ─── Subscription deleted ────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) {
          console.warn("[webhook] No profile for deleted subscription:", customerId);
          break;
        }

        await supabase
          .from("user_profiles")
          .update({
            subscription_plan: "free",
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("id", profile.id);

        console.log(`[webhook] Subscription deleted — user ${profile.id} reverted to free`);
        break;
      }

      // ─── Payment failed ──────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id ?? null;

        if (!customerId) break;

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!profile) break;

        await supabase
          .from("user_profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", profile.id);

        console.log(`[webhook] Payment failed — user ${profile.id} set to past_due`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("[stripe/webhook] Handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
