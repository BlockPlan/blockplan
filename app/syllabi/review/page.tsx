import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ReviewScreen from "./_components/ReviewScreen";

interface ReviewPageProps {
  searchParams: Promise<{ course_id?: string }>;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const courseId = params.course_id;

  if (!courseId) {
    redirect("/syllabi/upload");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Verify course belongs to user and fetch name
  const { data: course } = await supabase
    .from("courses")
    .select("id, name")
    .eq("id", courseId)
    .eq("user_id", user.id)
    .single();

  if (!course) {
    redirect("/syllabi/upload");
  }

  return <ReviewScreen courseId={courseId} courseName={course.name} />;
}
