import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LandingPage from "./(landing)/page";

export const metadata: Metadata = {
  title: "BlockPlan - AI-Powered Study Planner for College Students",
  description:
    "BlockPlan helps college students study smarter with AI-generated flash cards, quizzes, smart calendar scheduling, syllabus upload, and grade tracking. Start free today.",
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
    title: "BlockPlan - AI-Powered Study Planner for College Students",
    description:
      "Study smarter with AI-generated flash cards, quizzes, smart scheduling, and more. Free to start.",
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
