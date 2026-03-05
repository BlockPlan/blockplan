"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import {
  plannerSettingsSchema,
  type PlannerSettings,
} from "@/lib/validations/planner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlannerSettingsActionState = {
  success?: boolean;
  error?: string;
  errors?: Partial<Record<keyof PlannerSettings, string[]>>;
};

// ---------------------------------------------------------------------------
// savePlannerSettings
// ---------------------------------------------------------------------------

export async function savePlannerSettings(
  _prev: PlannerSettingsActionState,
  formData: FormData
): Promise<PlannerSettingsActionState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth");
  }

  const raw = {
    max_block_minutes: Number(formData.get("max_block_minutes")),
    min_block_minutes: Number(formData.get("min_block_minutes")),
    buffer_minutes: Number(formData.get("buffer_minutes")),
    backward_planning: formData.get("backward_planning") === "true",
  };

  const parsed = plannerSettingsSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Partial<
        Record<keyof PlannerSettings, string[]>
      >,
    };
  }

  const { error: upsertError } = await supabase
    .from("user_profiles")
    .upsert(
      { id: user.id, planner_settings: parsed.data },
      { onConflict: "id" }
    );

  if (upsertError) {
    return { error: "Failed to save preferences. Please try again." };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// deleteAccount
// ---------------------------------------------------------------------------

export async function deleteAccount(formData: FormData) {
  const confirmation = formData.get("confirmation") as string;

  if (confirmation !== "DELETE") {
    redirect("/settings?error=" + encodeURIComponent("Please type DELETE to confirm."));
  }

  const supabase = await createClient();
  const adminClient = createAdminClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth");
  }

  try {
    // Step 1: Delete all storage objects in the user's syllabi folder
    const { data: files } = await adminClient.storage
      .from("syllabi")
      .list(user.id);

    if (files && files.length > 0) {
      const filePaths = files.map((file) => `${user.id}/${file.name}`);
      await adminClient.storage.from("syllabi").remove(filePaths);
    }

    // Step 2: Delete the user account (cascade deletes all table data)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      redirect(
        "/settings?error=" +
          encodeURIComponent("Failed to delete account. Please try again.")
      );
    }

    // Step 3: Sign out the current session
    await supabase.auth.signOut();
  } catch {
    redirect(
      "/settings?error=" +
        encodeURIComponent("An error occurred. Please try again.")
    );
  }

  // Step 4: Redirect to auth with confirmation
  redirect("/auth?message=deleted");
}
