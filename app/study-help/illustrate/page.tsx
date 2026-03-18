import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavHeader from "@/app/plan/_components/NavHeader";
import IllustratePage from "./_components/IllustratePage";
import { getUserPlan } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "AI Illustration | BlockPlan",
  description: "Generate professional illustrations from text or clean up hand-drawn diagrams",
};

export default async function IllustrateRoute({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  const userPlan = await getUserPlan(user.id);

  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <IllustratePage
          courses={courses ?? []}
          initialCourseId={params.course_id}
          userPlan={userPlan}
        />
      </main>
    </div>
  );
}
