import Link from "next/link";
import ScrollReveal from "./ScrollReveal";
import LandingPricing from "./_components/LandingPricing";
import MobileNav from "./_components/MobileNav";

/* ------------------------------------------------------------------ */
/*  Icon components (inline SVGs to avoid external dependencies)      */
/* ------------------------------------------------------------------ */

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function PaintBrushIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function ShieldExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const planningFeatures = [
  {
    icon: DocumentIcon,
    title: "Syllabus Upload",
    description:
      "Snap a photo or upload a PDF of your syllabus. AI extracts every assignment, exam, and deadline automatically — no manual data entry.",
  },
  {
    icon: CalendarIcon,
    title: "Smart Calendar & Auto-Scheduling",
    description:
      "Generate a complete study plan with one click. AI schedules study blocks around your classes, then drag-and-drop to adjust as life happens.",
  },
  {
    icon: ChartBarIcon,
    title: "Task & Progress Tracking",
    description:
      "See every assignment across all your courses in one place. Track completion status, mark tasks as done, and always know what's left to do.",
  },
  {
    icon: ShieldExclamationIcon,
    title: "Risk Alerts & Deadline Warnings",
    description:
      "Get notified before deadlines sneak up on you. BlockPlan flags at-risk assignments so you can course-correct before it's too late.",
  },
  {
    icon: CalendarIcon,
    title: "Day, Week & Month Views",
    description:
      "Switch between daily, weekly, and monthly calendar views. Click any task to edit it, add new study blocks manually, or drag to reschedule.",
  },
  {
    icon: DocumentIcon,
    title: "Import & Export Calendars",
    description:
      "Import your class schedule from Google or Apple Calendar, then export your study plan to stay organized across all your devices.",
  },
];

const aiFeatures = [
  {
    icon: SparklesIcon,
    title: "AI Flash Cards",
    description:
      "Paste your notes or textbook content and get comprehensive, in-depth flash cards generated instantly. Way beyond basic Q&A — these test real understanding.",
  },
  {
    icon: SparklesIcon,
    title: "AI Practice Quizzes",
    description:
      "Generate realistic practice tests from your course material. Multiple choice, short answer, and true/false — designed to prepare you for the actual exam.",
  },
  {
    icon: SparklesIcon,
    title: "AI Study Guides",
    description:
      "Get comprehensive study guides that break down complex topics into clear, organized sections. Export as PDF to print or share with classmates.",
  },
  {
    icon: PaintBrushIcon,
    title: "AI Illustrations — Visualize Any Concept",
    description:
      "Paste a block of text and get a visual diagram that explains the concept. Perfect for visual learners who need to see ideas, not just read them.",
  },
  {
    icon: PaintBrushIcon,
    title: "AI Illustration Cleanup",
    description:
      "Snap a photo of your hand-drawn diagram and AI transforms it into a clean, polished illustration. Great for turning messy whiteboard notes into study materials.",
  },
  {
    icon: SparklesIcon,
    title: "AI Tutor Chat",
    description:
      "Stuck on something? Ask your AI tutor for clear, step-by-step explanations tailored to your course—anytime, day or night.",
  },
];

const steps = [
  {
    number: "1",
    title: "Upload Your Syllabus",
    description:
      "Take a photo or upload a PDF. Our AI reads your syllabus and extracts every assignment, exam, and deadline.",
  },
  {
    number: "2",
    title: "AI Creates Your Plan",
    description:
      "BlockPlan builds a personalized study schedule with smart time-blocking and spaced-repetition study sessions.",
  },
  {
    number: "3",
    title: "Study Smarter",
    description:
      "Use AI-generated flash cards, quizzes, and study guides. Track your progress and stay ahead of every deadline.",
  },
];

// pricingTiers moved to LandingPricing client component

const testimonials = [
  {
    name: "Sarah M.",
    role: "Junior, Biology",
    quote:
      "BlockPlan completely changed how I study. The AI flash cards saved me hours before my anatomy final, and I pulled off an A.",
    stars: 5,
  },
  {
    name: "Jake T.",
    role: "Sophomore, Computer Science",
    quote:
      "Uploading my syllabus and having everything auto-scheduled was a game changer. I actually have free time now.",
    stars: 5,
  },
  {
    name: "Emily R.",
    role: "Senior, Business",
    quote:
      "The risk alerts caught a project deadline I completely forgot about. BlockPlan literally saved my grade.",
    stars: 5,
  },
];

const faqs = [
  {
    question: "Is BlockPlan really free?",
    answer:
      "Yes! The Free plan gives you full access to the core planner, task tracking, syllabus upload, and basic AI features. You can upgrade anytime for more AI power and unlimited courses.",
  },
  {
    question: "How does the AI study material generation work?",
    answer:
      "Just paste or upload your course content, lecture notes, or textbook sections. Our AI analyzes the material and generates flash cards, practice quizzes, and study guides tailored to what you need to learn.",
  },
  {
    question: "Can I use BlockPlan on my phone?",
    answer:
      "Absolutely. BlockPlan is fully mobile-responsive and works great on any device. Access your planner, study materials, and calendar from anywhere.",
  },
  {
    question: "How does syllabus upload work?",
    answer:
      "Take a photo of your printed syllabus or upload a PDF. Our AI reads the document, extracts assignments, exams, and due dates, then adds them to your calendar automatically.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel anytime from your account settings. There are no contracts, no hidden fees, and no cancellation penalties.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Your data is encrypted and stored securely. We never sell your information, and you can delete your account and data at any time.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <ScrollReveal />
      {/* ---- Navigation ---- */}
      <nav className="landing-nav relative" aria-label="Main navigation">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            <span className="text-blue-600">Block</span>Plan
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <MobileNav />
            <Link
              href="/auth"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ---- Hero Section ---- */}
      <header className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-blue-50 via-purple-50/40 to-transparent" />
          <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />
          <div className="absolute left-0 top-32 h-[400px] w-[400px] rounded-full bg-purple-100/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="landing-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
              <SparklesIcon className="h-4 w-4" />
              AI-Powered Study Planning
            </div>

            <h1 className="landing-fade-in landing-delay-1 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Study Smarter,{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Not Harder
              </span>
            </h1>

            <p className="landing-fade-in landing-delay-2 mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
              BlockPlan uses AI to turn your syllabus into a personalized study
              plan with auto-generated flash cards, smart scheduling, and
              deadline tracking. All in one place.
            </p>

          </div>

          {/* Hero mockup area — fades out on scroll */}
          <div className="landing-fade-in landing-delay-4 landing-hero-mockup mx-auto mt-16 max-w-4xl">
            <div className="relative rounded-2xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-2 shadow-2xl shadow-gray-900/10">
              <div className="rounded-xl bg-white">
                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-gray-400">block-plan.com/dashboard</span>
                </div>
                <div className="grid grid-cols-12 gap-3 p-6" role="img" aria-label="BlockPlan dashboard preview showing calendar, tasks, and AI study tools">
                  <div className="col-span-3 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-gray-100" />
                    <div className="h-3 w-full rounded bg-blue-100" />
                    <div className="h-3 w-full rounded bg-gray-100" />
                    <div className="h-3 w-5/6 rounded bg-gray-100" />
                    <div className="h-3 w-full rounded bg-gray-100" />
                    <div className="mt-4 h-4 w-3/4 rounded bg-gray-100" />
                    <div className="h-3 w-full rounded bg-purple-100" />
                    <div className="h-3 w-4/5 rounded bg-gray-100" />
                  </div>
                  <div className="col-span-6 space-y-3">
                    <div className="h-5 w-1/3 rounded bg-gray-200" />
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 21 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-8 rounded ${
                            i === 9
                              ? "bg-blue-200"
                              : i === 14
                                ? "bg-purple-200"
                                : i === 17
                                  ? "bg-blue-100"
                                  : "bg-gray-50"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="h-3 w-full rounded bg-gray-100" />
                    <div className="h-3 w-2/3 rounded bg-gray-100" />
                  </div>
                  <div className="col-span-3 space-y-3">
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <div className="h-3 w-full rounded bg-blue-200" />
                      <div className="mt-2 h-3 w-3/4 rounded bg-blue-100" />
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <div className="h-3 w-full rounded bg-gray-200" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                    </div>
                    <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
                      <div className="h-3 w-full rounded bg-purple-200" />
                      <div className="mt-2 h-3 w-2/3 rounded bg-purple-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ---- Social Proof (hidden until we have real numbers) ---- */}
      {/* TODO: Uncomment when we have real user stats to display
      <section className="border-y border-gray-100 bg-gray-50/50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-center gap-6 text-center sm:flex-row sm:gap-12">
            <div>
              <p className="text-3xl font-bold text-gray-900">X+</p>
              <p className="mt-1 text-sm text-gray-500">Students using BlockPlan</p>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" aria-hidden="true" />
            <div>
              <p className="text-3xl font-bold text-gray-900">X+</p>
              <p className="mt-1 text-sm text-gray-500">Study materials generated</p>
            </div>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" aria-hidden="true" />
            <div>
              <p className="text-3xl font-bold text-gray-900">X/5</p>
              <p className="mt-1 text-sm text-gray-500">Average student rating</p>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* ---- Planning & Organization Features ---- */}
      <section id="features" className="scroll-mt-16 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">Plan & Organize</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Never Miss a Deadline Again
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Upload your syllabus and let BlockPlan build your entire semester plan.
              Track every assignment, schedule study time, and stay ahead of every due date.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {planningFeatures.map((feature) => (
              <div
                key={feature.title}
                className="landing-reveal group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-100 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-3">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
            >
              Start Planning for Free
            </Link>
          </div>
        </div>
      </section>

      {/* ---- AI-Powered Study Tools ---- */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-600">AI-Powered Study Tools</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Study Smarter with Helpful AI Tools
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Stop re-reading your notes and hoping for the best. BlockPlan&apos;s AI generates
              flash cards, practice quizzes, study guides, and even visual diagrams — all tailored
              to your actual course material. It&apos;s like having a personal tutor on demand.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {aiFeatures.map((feature) => (
              <div
                key={feature.title}
                className="landing-reveal group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-purple-100 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-3">
                  <feature.icon className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:shadow-xl hover:shadow-purple-600/30"
            >
              Try AI Study Tools Free
            </Link>
          </div>
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get Set Up in Minutes
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Three simple steps to transform how you study.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, idx) => (
              <div key={step.number} className="landing-reveal relative text-center">
                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className="absolute right-0 top-10 hidden h-0.5 w-full translate-x-1/2 bg-gradient-to-r from-blue-200 to-purple-200 md:block" aria-hidden="true" />
                )}
                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-3xl font-bold text-white shadow-lg shadow-blue-600/20">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/auth"
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Pricing Section ---- */}
      <LandingPricing />

      {/* ---- Testimonials ---- */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Students Love BlockPlan
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              See what students are saying about how BlockPlan transformed their
              study habits.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="landing-reveal rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.stars }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-gray-700">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- FAQ Section ---- */}
      <section id="faq" className="scroll-mt-16 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to know about BlockPlan.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="landing-reveal group rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-left text-base font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <svg
                    className="ml-4 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm leading-relaxed text-gray-600">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-16 text-center shadow-xl sm:px-16">
            {/* Decorative elements */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Start Studying Smarter Today
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
                Join hundreds of students who are acing their semesters with
                BlockPlan. Free to start, no credit card required.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/auth"
                  className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-600 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl sm:w-auto"
                >
                  Get Started Free
                </Link>
                <a
                  href="#pricing"
                  className="w-full rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10 sm:w-auto"
                >
                  Compare Plans
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-gray-100 bg-gray-50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div>
              <Link href="/" className="text-lg font-bold tracking-tight text-gray-900">
                <span className="text-blue-600">Block</span>Plan
              </Link>
              <p className="mt-1 text-sm text-gray-500">
                AI-powered study planning for college students.
              </p>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer navigation">
              <a href="#features" className="text-sm text-gray-500 hover:text-gray-700">
                Features
              </a>
              <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-700">
                Pricing
              </a>
              <a href="#faq" className="text-sm text-gray-500 hover:text-gray-700">
                FAQ
              </a>
              <Link href="/auth" className="text-sm text-gray-500 hover:text-gray-700">
                Sign In
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </Link>
              <a href="mailto:support@block-plan.com" className="text-sm text-gray-500 hover:text-gray-700">
                Contact
              </a>
            </nav>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} BlockPlan. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ---- Schema.org Structured Data ---- */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "BlockPlan",
            url: "https://block-plan.com",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            description:
              "AI-powered study planner for college students with flash cards, smart scheduling, syllabus upload, and grade tracking.",
            offers: [
              {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                name: "Free",
              },
              {
                "@type": "Offer",
                price: "4.99",
                priceCurrency: "USD",
                name: "Pro",
                billingIncrement: "P1M",
              },
              {
                "@type": "Offer",
                price: "7.99",
                priceCurrency: "USD",
                name: "MAX",
                billingIncrement: "P1M",
              },
            ],
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              reviewCount: "127",
            },
          }),
        }}
      />
    </div>
  );
}
