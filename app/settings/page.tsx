import { redirect } from "next/navigation";

// Settings have been consolidated into the Profile page.
// This redirect ensures existing links and bookmarks still work.
export default function SettingsPage() {
  redirect("/profile");
}
