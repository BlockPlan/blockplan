import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | BlockPlan",
  description: "BlockPlan privacy policy — how we collect, use, and protect your data.",
};

const sections = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: [
      {
        subtitle: "Account Information",
        text: "When you create a BlockPlan account, we collect your email address and password (stored securely via Supabase Auth). If you sign in through a third-party OAuth provider (such as Google), we receive your name and email address from that provider.",
      },
      {
        subtitle: "Course Materials & Content",
        text: "You may upload syllabi (PDF or images), lecture notes, textbook excerpts, and other study materials. We store this content in our database to provide our services, including AI-generated study materials.",
      },
      {
        subtitle: "User-Generated Content",
        text: "This includes tasks, study plans, calendar blocks, flashcards, quizzes, notes, course information, grades, and feedback you create within the app.",
      },
      {
        subtitle: "Usage Data",
        text: "We collect basic usage information such as pages visited, features used, and general interaction patterns to improve the service. We do not use third-party analytics or tracking scripts.",
      },
    ],
  },
  {
    id: "how-we-use-your-information",
    title: "2. How We Use Your Information",
    content: [
      {
        text: "We use your information to:",
      },
      {
        text: "\u2022 Provide and operate BlockPlan's core features (task management, calendar scheduling, study planning)",
      },
      {
        text: "\u2022 Generate AI-powered study materials (summaries, flashcards, quizzes, practice problems, diagrams) from your uploaded course content",
      },
      {
        text: "\u2022 Process payments and manage your subscription",
      },
      {
        text: "\u2022 Send essential account notifications (password resets, subscription changes)",
      },
      {
        text: "\u2022 Improve and develop new features for the service",
      },
      {
        text: "\u2022 Respond to your feedback and support requests",
      },
      {
        text: "We do not sell, rent, or trade your personal information to third parties.",
      },
    ],
  },
  {
    id: "third-party-services",
    title: "3. Third-Party Services",
    content: [
      {
        subtitle: "OpenAI",
        text: "Your course materials, uploaded content, and related text are sent to OpenAI's API to generate study materials (summaries, flashcards, quizzes, diagrams, etc.). OpenAI processes this data according to their API data usage policies. See Section 4 for more details.",
      },
      {
        subtitle: "Stripe",
        text: "We use Stripe to process subscription payments. Your payment information (credit card numbers, billing address) is collected and stored directly by Stripe — we never store your full payment details on our servers. We only retain a Stripe customer ID to manage your subscription.",
      },
      {
        subtitle: "Supabase",
        text: "Our application data (your account, tasks, study materials, and generated content) is stored in a PostgreSQL database hosted by Supabase. Supabase also handles authentication, including secure password hashing and session management.",
      },
      {
        subtitle: "Vercel",
        text: "BlockPlan is hosted on Vercel. Vercel processes incoming web requests and may collect standard server logs (IP addresses, request timestamps) as part of normal web hosting operations.",
      },
    ],
  },
  {
    id: "data-sent-to-ai",
    title: "4. Data Sent to AI",
    content: [
      {
        text: "This is an important section to understand. When you use BlockPlan's AI features (study material generation, syllabus parsing, AI Tutor Chat, diagram generation), the following data may be sent to OpenAI for processing:",
      },
      {
        text: "\u2022 Text content from uploaded documents (syllabi, notes, textbook excerpts)",
      },
      {
        text: "\u2022 Images of documents or hand-drawn illustrations you upload",
      },
      {
        text: "\u2022 Your course names, task titles, and related academic content",
      },
      {
        text: "\u2022 Chat messages you send to the AI Tutor",
      },
      {
        subtitle: "What this means for you",
        text: "We use OpenAI's API, which has its own data handling policies. As of this policy's effective date, OpenAI's API data usage policy states that data sent through the API is not used to train their models. However, OpenAI's policies may change, and we encourage you to review OpenAI's current privacy policy and API data usage policies directly. We do not send your email address, password, or payment information to OpenAI.",
      },
    ],
  },
  {
    id: "data-security",
    title: "5. Data Security",
    content: [
      {
        text: "We take reasonable measures to protect your information, including:",
      },
      {
        text: "\u2022 Passwords are hashed and never stored in plain text (handled by Supabase Auth)",
      },
      {
        text: "\u2022 All data is transmitted over HTTPS/TLS encryption",
      },
      {
        text: "\u2022 Database access is restricted through Supabase row-level security policies",
      },
      {
        text: "\u2022 Payment data is handled entirely by Stripe, a PCI-DSS compliant payment processor",
      },
      {
        text: "While we strive to protect your data, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security.",
      },
    ],
  },
  {
    id: "data-retention",
    title: "6. Data Retention",
    content: [
      {
        text: "We retain your data for as long as your account is active. This includes your account information, tasks, study materials, AI-generated content, and calendar data.",
      },
      {
        subtitle: "Account Deletion",
        text: "You can delete your account at any time from the Settings page. When you delete your account, we permanently delete your profile, tasks, study sessions, calendar blocks, courses, notes, and all associated data from our database. Stripe will retain your payment history in accordance with their data retention policies and legal obligations. Content previously sent to OpenAI for processing is subject to OpenAI's data retention policies.",
      },
      {
        subtitle: "Inactive Accounts",
        text: "We may delete accounts that have been inactive for an extended period (12+ months) after sending a notice to your registered email address.",
      },
    ],
  },
  {
    id: "childrens-privacy",
    title: "7. Children's Privacy",
    content: [
      {
        text: "BlockPlan is designed for college students and is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected information from a child under 13, we will delete that information promptly. If you believe a child under 13 has provided us with personal information, please contact us at support@block-plan.com.",
      },
    ],
  },
  {
    id: "your-rights",
    title: "8. Your Rights",
    content: [
      {
        text: "You have the following rights regarding your data:",
      },
      {
        subtitle: "Access",
        text: "You can view all of your data within the app at any time (tasks, study materials, courses, calendar, settings).",
      },
      {
        subtitle: "Deletion",
        text: "You can delete your account and all associated data from the Settings page. You can also delete individual tasks, study sessions, courses, and notes at any time.",
      },
      {
        subtitle: "Export",
        text: "You can export your study materials as PDF or DOCX files and your calendar schedule as an .ics file.",
      },
      {
        subtitle: "Correction",
        text: "You can edit your account information, tasks, and study materials at any time within the app.",
      },
      {
        text: "For any data requests that cannot be handled through the app, contact us at support@block-plan.com.",
      },
    ],
  },
  {
    id: "cookies-and-tracking",
    title: "9. Cookies & Tracking",
    content: [
      {
        text: "BlockPlan uses minimal cookies:",
      },
      {
        subtitle: "Authentication Cookies",
        text: "We use session cookies to keep you signed in. These are essential for the app to function and are set by Supabase Auth.",
      },
      {
        subtitle: "No Third-Party Trackers",
        text: "We do not currently use third-party analytics services, advertising cookies, or tracking pixels. We do not track you across other websites.",
      },
      {
        text: "If we add analytics or tracking in the future, we will update this policy accordingly.",
      },
    ],
  },
  {
    id: "changes-to-this-policy",
    title: "10. Changes to This Policy",
    content: [
      {
        text: "We may update this Privacy Policy from time to time. If we make material changes, we will notify you by updating the effective date at the top of this page. We encourage you to review this page periodically to stay informed about how we protect your data. Continued use of BlockPlan after changes constitutes acceptance of the updated policy.",
      },
    ],
  },
  {
    id: "contact-information",
    title: "11. Contact Information",
    content: [
      {
        text: "If you have questions or concerns about this Privacy Policy or your data, please contact us:",
      },
      {
        text: "\u2022 Email: support@block-plan.com",
      },
      {
        text: "\u2022 Website: block-plan.com",
      },
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple nav for public page */}
      <nav className="border-b border-gray-100 bg-white" aria-label="Main navigation">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            <span className="text-blue-600">Block</span>Plan
          </Link>
          <Link
            href="/auth"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Effective Date: March 20, 2026
          </p>
          <p className="mt-4 text-sm text-gray-600">
            BlockPlan (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;)
            operates the web application at block-plan.com. This Privacy Policy
            explains how we collect, use, and protect your information when you
            use our service.
          </p>
        </div>

        {/* Quick jump nav */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Jump to section
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {s.title.replace(/^\d+\.\s*/, "")}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="scroll-mt-20 rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.content.map((item, i) => (
                  <div key={i}>
                    {"subtitle" in item && item.subtitle && (
                      <h3 className="mb-1 text-sm font-semibold text-gray-800">
                        {item.subtitle}
                      </h3>
                    )}
                    <p className="text-sm leading-relaxed text-gray-600">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm text-gray-500">
            Questions about your privacy?{" "}
            <a
              href="mailto:support@block-plan.com"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Contact us at support@block-plan.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
