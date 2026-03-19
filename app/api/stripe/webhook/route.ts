import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Disable body parsing — Stripe needs the raw body for signature verification
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Map Stripe price IDs to subscription plans
// ---------------------------------------------------------------------------
function planFromPriceId(priceId: string): "pro" | "max" | null {
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
    // No webhook secret configured — parse the event directly
    // This is fine during development; configure STRIPE_WEBHOOK_SECRET in production
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // ─── Checkout completed ──────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.supabase_user_id ??
          (session.subscription
            ? undefined
            : undefined);

        if (!userId) {
          console.warn("[webhook] No supabase_user_id in session metadata");
          break;
        }

        // Retrieve subscription to get the price ID
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!subscriptionId) break;

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? planFromPriceId(priceId) : null;

        if (!plan) {
          console.warn("[webhook] Unknown price ID:", priceId);
          break;
        }

        await supabase
          .from("user_profiles")
          .update({
            subscription_plan: plan,
            subscription_status: "active",
            stripe_customer_id:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? null,
            stripe_subscription_id: subscriptionId,
          })
          .eq("id", userId);

        console.log(
          `[webhook] User ${userId} subscribed to ${plan} (sub: ${subscriptionId})`
        );
        break;
      }

      // ─── Subscription updated (plan change) ─────────────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = priceId ? planFromPriceId(priceId) : null;

        // Look up user by stripe_customer_id
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
          console.warn(
            "[webhook] No profile found for customer:",
            customerId
          );
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
          console.warn(
            "[webhook] No profile for deleted subscription customer:",
            customerId
          );
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

        console.log(
          `[webhook] Subscription deleted — user ${profile.id} reverted to free`
        );
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

        console.log(
          `[webhook] Payment failed — user ${profile.id} set to past_due`
        );
        break;
      }

      default:
        // Unhandled event type — ignore
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
