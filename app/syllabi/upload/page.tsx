import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavHeader from "@/app/plan/_components/NavHeader";
import UploadForm from "./_components/UploadForm";

interface Course {
  id: string;
  name: string;
}

export const metadata: Metadata = {
  title: "Upload Syllabus | BlockPlan",
  description: "Import tasks from your course syllabus",
};

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

  // No courses — show helpful message instead of forcing onboarding
  if (courseList.length === 0) {
    return (
      <div className="page-bg">
        <NavHeader />
        <main className="mx-auto max-w-2xl px-4 py-10 text-center">
          <h2 className="text-xl font-semibold text-gray-900">No courses yet</h2>
          <p className="mt-2 text-gray-500">Add your courses first, then you can upload syllabi.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/onboarding" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Set up courses
            </Link>
            <Link href="/dashboard" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Back to dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Upload Syllabus</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select a course, upload your syllabus PDF or snap a photo of it,
            and we&apos;ll automatically extract your assignments and exams.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <UploadForm courses={courseList} />
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          PDFs and photos (PNG, JPG) up to 10 MB are supported.{" "}
          <Link href="/tasks" className="underline hover:text-gray-600">
            Prefer to add tasks manually?
          </Link>
        </p>
      </main>
    </div>
  );
}
