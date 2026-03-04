import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
    console.error("[auth/callback] Code exchange failed:", error.message);
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(
    `${origin}/auth?error=${encodeURIComponent("Could not authenticate. Please try again.")}`
  );
}
