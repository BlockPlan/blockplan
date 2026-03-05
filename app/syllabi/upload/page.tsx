import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavHeader from "@/app/plan/_components/NavHeader";
import UploadForm from "./_components/UploadForm";

interface Course {
  id: string;
  name: string;
}

export default async function SyllabiUploadPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Fetch user's courses with term info for the selector
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const courseList: Course[] = courses ?? [];

  // No courses — redirect to onboarding
  if (courseList.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Upload Syllabus</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select a course, choose your PDF syllabus, and we&apos;ll
            automatically extract your assignments and exams.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <UploadForm courses={courseList} />
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          PDFs up to 10 MB are supported.{" "}
          <Link href="/tasks" className="underline hover:text-gray-600">
            Prefer to add tasks manually?
          </Link>
        </p>
      </main>
    </div>
  );
}
