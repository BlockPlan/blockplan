"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

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
