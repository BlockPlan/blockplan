import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | BlockPlan",
  description: "Terms of Service for BlockPlan — AI-powered study planning for college students.",
};

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: `By accessing or using BlockPlan ("the Service"), available at block-plan.com, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. Your continued use of BlockPlan after any changes to these Terms constitutes acceptance of those changes.`,
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: `BlockPlan is an AI-powered academic planning and study tool designed for college students. The Service allows users to:

- Upload course materials (syllabi, lecture notes, textbook content) for AI-powered analysis
- Automatically extract assignments, exams, and due dates from uploaded syllabi
- Generate AI-powered study materials including flash cards, quizzes, study guides, practice problems, and visual diagrams
- Create and manage study schedules with smart calendar planning
- Track tasks, assignments, and academic progress
- Use an AI tutor chat for interactive study assistance
- Generate and clean up illustrations for study materials

BlockPlan uses third-party AI services (including OpenAI) to process content and generate study materials.`,
  },
  {
    id: "accounts",
    title: "3. Account Registration",
    content: `To use BlockPlan, you must create an account. You agree to:

- Provide accurate, current, and complete information during registration
- Maintain the security of your account credentials
- Notify us immediately of any unauthorized use of your account
- Accept responsibility for all activity that occurs under your account

You must be at least 13 years of age to create an account and use BlockPlan. If you are under 18, you represent that you have your parent or guardian's permission to use the Service. We do not knowingly collect personal information from children under 13 in compliance with the Children's Online Privacy Protection Act (COPPA).`,
  },
  {
    id: "payments",
    title: "4. Subscription & Payments",
    content: `BlockPlan offers the following subscription tiers:

- Free: Core planning features with 1 AI generation per month, 2 courses, 1 illustration per month, 2 saved study sessions
- Pro ($4.99/month): 100 AI generations per month, unlimited courses, unlimited illustrations, 50 saved sessions, AI Tutor Chat
- Max ($7.99/month): All Pro features plus unlimited AI generations, unlimited illustrations, unlimited saved sessions, priority AI processing, advanced analytics, and early access to new features

Payment terms:

- All paid subscriptions are billed monthly and renew automatically until canceled
- Payments are processed securely through Stripe
- You may cancel your subscription at any time from your account settings; cancellation takes effect at the end of the current billing period
- No refunds are provided for partial months or unused portions of a subscription period
- BlockPlan reserves the right to change subscription pricing with 30 days' notice to existing subscribers
- If payment fails, your account may be downgraded to the Free tier after a grace period`,
  },
  {
    id: "acceptable-use",
    title: "5. Acceptable Use",
    content: `You agree to use BlockPlan only for lawful purposes and in accordance with these Terms. You agree NOT to:

- Use the Service to facilitate cheating, plagiarism, or academic dishonesty of any kind
- Submit AI-generated study materials as your own original work in violation of your institution's academic integrity policies
- Upload, share, or distribute illegal, harmful, threatening, abusive, or otherwise objectionable content
- Attempt to reverse-engineer, decompile, or disassemble any part of the Service
- Use automated scripts, bots, or scrapers to access or interact with the Service
- Interfere with or disrupt the Service or servers connected to the Service
- Share your account credentials with others or allow others to access your account
- Use the Service in any way that violates applicable local, state, national, or international law

BlockPlan is designed to supplement your learning, not replace it. You are responsible for using the Service ethically and in compliance with your institution's academic policies.`,
  },
  {
    id: "ai-content",
    title: "6. AI-Generated Content Disclaimer",
    content: `BlockPlan uses artificial intelligence to generate study materials, including summaries, flash cards, quizzes, practice problems, study guides, visual diagrams, and illustrations. You acknowledge and agree that:

- AI-generated content may contain errors, inaccuracies, or omissions and is not guaranteed to be correct, complete, or up to date
- AI-generated content is provided as a study aid only and is not a substitute for attending classes, reading assigned materials, or doing your own studying
- You should always verify AI-generated content against your course materials, textbooks, and instructor guidance
- BlockPlan does not guarantee any particular academic outcome from using AI-generated study materials
- The quality and accuracy of AI-generated content depends in part on the quality of the source materials you provide
- AI-generated illustrations and diagrams are approximations and may not perfectly represent complex concepts

BlockPlan and its operators are not liable for any academic consequences resulting from reliance on AI-generated content.`,
  },
  {
    id: "ip",
    title: "7. Intellectual Property",
    content: `User content: You retain all ownership rights to the materials you upload to BlockPlan (syllabi, notes, documents, images). By uploading content, you grant BlockPlan a limited, non-exclusive license to process your materials for the purpose of providing the Service (e.g., generating study materials from your uploads). We do not claim ownership of your uploaded content.

AI-generated content: Study materials generated by the AI (flash cards, quizzes, summaries, diagrams, etc.) are provided for your personal educational use. You may use, download, and share these materials for non-commercial educational purposes.

Platform: The BlockPlan platform, including its design, code, branding, logos, and documentation, is the intellectual property of BlockPlan and is protected by applicable intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the platform without our written permission.`,
  },
  {
    id: "privacy",
    title: "8. Privacy",
    content: `Your privacy is important to us. Our collection and use of personal information in connection with BlockPlan is described in our Privacy Policy. By using the Service, you agree to the collection, use, and sharing of your information as described in the Privacy Policy.

Key points:

- We do not sell your personal information to third parties
- Uploaded course materials are processed by AI services to provide study features and are not used to train AI models
- You can delete your account and all associated data at any time from your account settings
- We use industry-standard security measures to protect your data`,
  },
  {
    id: "termination",
    title: "9. Termination",
    content: `You may terminate your account at any time by using the "Delete Account" option in your account settings. Upon termination, your data will be permanently deleted.

BlockPlan reserves the right to suspend or terminate your account at any time, with or without notice, for conduct that we determine, in our sole discretion:

- Violates these Terms of Service
- Is harmful to other users, third parties, or the business interests of BlockPlan
- Involves fraudulent, abusive, or illegal activity

Upon termination, your right to use the Service immediately ceases. Any fees already paid are non-refundable.`,
  },
  {
    id: "liability",
    title: "10. Limitation of Liability",
    content: `To the maximum extent permitted by applicable law, BlockPlan and its operators, affiliates, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:

- Loss of data, grades, or academic standing
- Errors or inaccuracies in AI-generated content
- Interruption or unavailability of the Service
- Unauthorized access to your account
- Any other matter relating to the Service

The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.

In no event shall our total liability to you for all claims arising from or related to the Service exceed the amount you have paid us in the twelve (12) months immediately preceding the event giving rise to the claim.`,
  },
  {
    id: "changes",
    title: "11. Changes to Terms",
    content: `We reserve the right to modify these Terms at any time. When we make material changes, we will:

- Update the "Effective Date" at the top of this page
- Notify registered users via email or an in-app notification

Your continued use of BlockPlan after the revised Terms become effective constitutes your acceptance of the updated Terms. If you do not agree to the revised Terms, you must stop using the Service and delete your account.`,
  },
  {
    id: "contact",
    title: "12. Contact Information",
    content: `If you have any questions about these Terms of Service, please contact us at:

Email: support@block-plan.com
Website: block-plan.com`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white" aria-label="Main navigation">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-gray-900">
            <span className="text-blue-600">Block</span>Plan
          </Link>
          <div className="flex items-center gap-3">
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

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Effective Date: March 20, 2026
          </p>
          <p className="mt-4 text-base text-gray-600">
            Welcome to BlockPlan. These Terms of Service govern your use of the
            BlockPlan platform and services available at block-plan.com. Please
            read these terms carefully before using the Service.
          </p>
        </div>

        {/* Quick jump nav */}
        <div className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Jump to section
          </p>
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {s.title.replace(/^\d+\.\s*/, "")}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-20"
            >
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                {section.title}
              </h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-500">
            Questions about these terms?{" "}
            <a
              href="mailto:support@block-plan.com"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Contact us
            </a>
            .
          </p>
          <p className="mt-4 text-xs text-gray-400">
            &copy; {new Date().getFullYear()} BlockPlan. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
