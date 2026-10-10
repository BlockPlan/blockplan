"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isDisposableEmail } from "@/lib/disposable-emails";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Honeypot field — humans never fill this; bots usually do
  const honeypot = formData.get("website") as string | null;
  if (honeypot && honeypot.trim().length > 0) {
    // Pretend success to confuse the bot, but don't actually create an account
    redirect("/auth?message=Check%20your%20email%20to%20confirm%20your%20account.");
  }

  // Block disposable email domains
  if (isDisposableEmail(email)) {
    redirect(
      `/auth?error=${encodeURIComponent("Please use a real email address. Disposable email providers are not allowed.")}`
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  // Ensure a user_profiles row exists (belt-and-suspenders alongside DB trigger)
  if (data?.user) {
    const adminSupabase = (await import("@/lib/supabase/admin")).createAdminClient();
    await adminSupabase
      .from("user_profiles")
      .upsert(
        { id: data.user.id, timezone: "America/Boise" },
        { onConflict: "id", ignoreDuplicates: true }
      );
  }

  // If Supabase did not return a session, email confirmation is required.
  // Tell the user to check their inbox instead of silently dropping them
  // onto a blank sign-in form.
  if (!data?.session) {
    redirect(
      "/auth?message=" +
        encodeURIComponent(
          "Check your email to confirm your account. The link may take a minute to arrive — remember to look in Promotions or Spam."
        )
    );
  }

  // Auto-confirmed (e.g. confirmations disabled in Supabase) → go straight in.
  redirect("/onboarding");
}

export async function signin(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  // Ensure a user_profiles row exists for users who signed up before the trigger
  if (data?.user) {
    await supabase
      .from("user_profiles")
      .upsert(
        { id: data.user.id, timezone: "America/Boise" },
        { onConflict: "id", ignoreDuplicates: true }
      );
  }

  // Send users who have never set up a term through onboarding first — the
  // empty dashboard was confusing and most never returned after seeing it.
  if (data?.user) {
    const { count: termCount } = await supabase
      .from("terms")
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.user.id);
    if (!termCount || termCount === 0) {
      redirect("/onboarding");
    }
  }

  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/reset-password`,
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/auth?message=${encodeURIComponent("Check your email for a password reset link.")}`
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      `/auth/reset-password?error=${encodeURIComponent(error.message)}`
    );
  }

  redirect("/dashboard");
}

export async function signout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
