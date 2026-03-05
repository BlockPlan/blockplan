import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import Link from "next/link";
import CreateSessionClient from "./_components/CreateSessionClient";

export default async function CreateStudyHelpPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-4">
          <Link
            href="/study-help"
            className="text-sm text-blue-600 hover:underline"
          >
            &larr; Back to Study Help
          </Link>
        </div>
        <h1 className="page-title mb-2">Create Flashcards &amp; Quiz</h1>
        <p className="mb-6 text-sm text-gray-500">
          Build your own flashcards and quiz questions from scratch.
        </p>
        <CreateSessionClient courses={courses ?? []} />
      </main>
    </div>
  );
}
