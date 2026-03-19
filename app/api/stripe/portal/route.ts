import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Look up the user's stripe_customer_id
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    const customerId = profile?.stripe_customer_id as string | null;

    if (!customerId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this user" },
        { status: 404 }
      );
    }

    // Create a billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.nextUrl.origin}/pricing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[stripe/portal] Error:", err);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
