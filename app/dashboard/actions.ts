"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// addQuickNote
// ---------------------------------------------------------------------------

export async function addQuickNote(content: string) {
  if (!content.trim()) return { error: "Note cannot be empty." };
  if (content.length > 500) return { error: "Note is too long (max 500 characters)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { error } = await supabase
    .from("quick_notes")
    .insert({ user_id: user.id, content: content.trim() });

  if (error) return { error: "Failed to save note." };

  revalidatePath("/dashboard");
  return { success: true };
}

// ---------------------------------------------------------------------------
// deleteQuickNote
// ---------------------------------------------------------------------------

export async function deleteQuickNote(noteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { error } = await supabase
    .from("quick_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) return { error: "Failed to delete note." };

  revalidatePath("/dashboard");
  return { success: true };
}
