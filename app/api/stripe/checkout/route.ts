import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId } = await req.json();

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: "priceId and userId are required" },
        { status: 400 }
      );
    }

    // Validate priceId against allowed price IDs (monthly + annual)
    const allowedPriceIds = [
      process.env.STRIPE_PRO_PRICE_ID,
      process.env.STRIPE_MAX_PRICE_ID,
      process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
      process.env.STRIPE_MAX_ANNUAL_PRICE_ID,
    ].filter(Boolean);

    if (!allowedPriceIds.includes(priceId)) {
      return NextResponse.json(
        { error: "Invalid price ID" },
        { status: 400 }
      );
    }

    // Fetch user email from Supabase
    const supabase = createAdminClient();
    const { data: userData, error: userError } =
      await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user?.email) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already has a stripe_customer_id and trial status
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id, has_used_trial")
      .eq("id", userId)
      .single();

    let customerId = profile?.stripe_customer_id as string | null;

    // Create or retrieve the Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.user.email,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      // Save customer ID to profile immediately (upsert in case profile missing)
      await supabase
        .from("user_profiles")
        .upsert(
          { id: userId, stripe_customer_id: customerId },
          { onConflict: "id" }
        );
    }

    // Determine if user is eligible for a free trial
    const hasUsedTrial = profile?.has_used_trial === true;

    // Create checkout session — add 14-day trial if user hasn't used one yet
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/pricing?success=true`,
      cancel_url: `${req.nextUrl.origin}/pricing?canceled=true`,
      subscription_data: {
        metadata: { supabase_user_id: userId },
        ...(!hasUsedTrial ? { trial_period_days: 14 } : {}),
      },
      metadata: { supabase_user_id: userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] Error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
