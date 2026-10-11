import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingPage from "./(landing)/page";

export const metadata: Metadata = {
  title: "BlockPlan — Syllabus-to-Study-Plan AI for College Students",
  description:
    "Upload your syllabus. BlockPlan builds the plan: every assignment, every exam, every study block, scheduled around your classes. AI tutoring built around your actual courses. Free to start.",
  keywords: [
    "student planner",
    "AI study tools",
    "college planner",
    "flash cards",
    "study guide",
    "syllabus upload",
    "grade tracker",
    "BYU-Idaho",
    "academic planner",
    "smart scheduling",
  ],
  openGraph: {
    title: "BlockPlan — Syllabus-to-Study-Plan AI for College Students",
    description:
      "Upload your syllabus. BlockPlan builds the plan. AI tutoring built around your actual courses, not generic ChatGPT.",
    url: "https://block-plan.com",
    siteName: "BlockPlan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlockPlan - AI-Powered Study Planner",
    description:
      "Study smarter with AI-generated flash cards, quizzes, smart scheduling, and more.",
  },
  alternates: {
    canonical: "https://block-plan.com",
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
