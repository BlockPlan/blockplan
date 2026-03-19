import type { Metadata } from "next";
import NavHeader from "@/app/plan/_components/NavHeader";

const sections = [
  {
    title: "Dashboard",
    icon: "📊",
    description:
      "Your home base. See an overview of your academic progress at a glance.",
    steps: [
      "Navigate to the Dashboard tab — it loads automatically after sign-in.",
      "View your overall task completion progress (blue bar) at the top of the welcome card.",
      "Upcoming Deadlines appear below the progress bar — tasks due within the next 3 days are shown with color-coded badges (Overdue, Due today, Due tomorrow, Due in X days). Click any deadline to jump to that task.",
      'See your next scheduled study block under "Next Up".',
      'Review your top 5 upcoming tasks sorted by due date under "Top Priorities". Clicking a task highlights and scrolls to it on the Tasks page.',
      'Use "Quick Notes" to jot down personal reminders, to-dos, or thoughts — add and delete notes right from the Dashboard.',
      "Risk alerts appear when tasks are overdue or at risk of falling behind.",
      "Enable browser reminders from the banner at the top to get notifications before due dates.",
      'Use the quick action buttons at the bottom to jump to Weekly Plan, Daily View, or All Tasks.',
      'First time? A guided tour will walk you through the key features when you first visit the Dashboard. You can skip it anytime.',
      'New users will also see a "Getting Started" card with step-by-step setup instructions that disappears once you add tasks.',
    ],
  },
  {
    title: "Calendar / Weekly Plan",
    icon: "📅",
    description:
      "Plan your study schedule with a visual weekly calendar. Blocks of study time can be auto-generated or manually added and adjusted.",
    steps: [
      'Click "Calendar" in the navigation bar.',
      "Toggle between Day, Week, and Month views using the buttons in the top-right.",
      'Click "Generate Plan" to auto-schedule study blocks based on your tasks and available time. This replaces all currently scheduled blocks but keeps done and missed blocks.',
      'Click "Add Block" to manually create a single study block. You can link it to an existing task, or switch to "Custom Block" to type your own name (e.g., "Group study session", "Review lecture notes"). This does not affect any other blocks.',
      "Click any study block to edit it — change the assigned task, date, or time, or delete the block entirely.",
      'Click "Export to Calendar" to download an .ics file for Google Calendar or Apple Calendar.',
      "Mark blocks as done (checkmark) or missed (X) using the action buttons on each block.",
      "Done blocks turn green, missed blocks turn red. Missed blocks auto-reschedule remaining work.",
      "To undo a done or missed block, click the undo arrow (↩) that appears on the block.",
      "Drag and drop blocks between days in the Week view to reschedule them.",
      "In Month view, colored dots and status icons show your schedule density and completion. Click any day to drill into the Day view.",
      "Tip: Use Generate Plan for your initial schedule, then use Add Block and click-to-edit for adjustments throughout the semester.",
    ],
  },
  {
    title: "Tasks",
    icon: "✅",
    description:
      "Create, edit, and manage all your assignments, exams, readings, and other tasks.",
    steps: [
      'Click "Tasks" in the navigation bar.',
      'Click "Add Task" to create a new task.',
      "Fill in the title, type (Assignment, Exam, Reading, or Other), course, due date, and estimated time.",
      "Optionally set a reminder (30 min to 1 week before due date) for browser notifications.",
      "Add notes to any task using the Notes field — notes appear as a preview under the task title in the list.",
      "Click the circle icon on the left of any task to toggle its status: To Do → In Progress → Completed.",
      "Click the pencil icon to edit a task — you can change the status, title, type, due date, and more.",
      "Click the trash icon to delete a task.",
      "Tasks with subtask milestones show a progress bar — click to expand and check off milestones.",
      'For exams and readings, a "Study" link appears to start an AI-powered study session.',
    ],
  },
  {
    title: "Task Status",
    icon: "🔄",
    description:
      "Track where each task stands with three status levels.",
    steps: [
      "To Do (○) — Task hasn't been started yet. This is the default status.",
      "In Progress (◑) — You've begun working on the task.",
      "Completed (●) — Task is finished. It will be removed from the Top Priorities list on the dashboard.",
      "Change status by clicking the circle icon on the Tasks page, or use the status toggle buttons in the Edit Task dialog.",
      "Status is shown on calendar blocks too — checkmarks for completed, half-circles for in progress.",
    ],
  },
  {
    title: "Recurring Tasks",
    icon: "🔁",
    description:
      "Set up tasks that repeat daily or weekly (e.g., Discussion Posts every Tuesday and Thursday, or daily journal entries).",
    steps: [
      'When creating a new task, check the "Repeat task" checkbox.',
      "Choose a frequency: Daily (every day) or Weekly (specific days of the week).",
      "If you choose Weekly, select which days the task should repeat on (Sun through Sat).",
      'Set a "Repeat until" end date — instances will be generated up to that date.',
      "Click Create — the system generates individual task instances for each occurrence.",
      "Recurring tasks show a purple \"Recurring\" badge on the Tasks page.",
      'When deleting a recurring task, you\'ll be asked: "This task only", "This and future tasks", or "All tasks in series".',
    ],
  },
{
    title: "Reminders",
    icon: "🔔",
    description:
      "Get browser notifications before assignments are due.",
    steps: [
      'When you first visit the Dashboard, you\'ll see an "Enable Reminders" banner — click Enable to grant notification permission.',
      "When creating or editing a task, use the Reminder dropdown to set when you want to be notified.",
      "Options: 30 minutes, 1 hour, 2 hours, 1 day, 2 days, or 1 week before the due date.",
      "Tasks with reminders show an amber bell icon badge on the Tasks page.",
      "Reminders are scheduled automatically when you visit the Dashboard.",
      "When a reminder fires, you'll see a browser notification with the task title and due date.",
      "Click the notification to jump to the Dashboard.",
      "Note: Reminders require an open browser tab. They won't fire if the browser is completely closed.",
    ],
  },
  {
    title: "Study Help (AI)",
    icon: "🤖",
    description:
      "Get AI-powered study assistance — flashcards, quizzes, summaries, and more.",
    steps: [
      'Click "Study Help" in the navigation bar.',
      "Upload PDFs, PowerPoints (.pptx), Word docs (.docx), or photos of your textbook, or paste your notes directly.",
      "Select a course (optional) to tag the study materials.",
      "The AI generates a detailed summary (15–25 points), key terms with thorough definitions, 20–30 flashcards, 15–20 quiz questions, and practice test questions.",
      "Each plan has a monthly generation limit — Free: 1/month, Pro: 15/month, Max: 50/month. Your usage is shown below the generate button.",
      'You can also start a study session from the Tasks page — click the "Study" link next to any exam or reading task.',
      "Study sessions are tailored to your course content and uploaded materials.",
      'Click "View saved sessions" to browse your study help history.',
      "From the history page, click any session to review, edit, or share it.",
      'In the Flashcards tab, click "Study Mode" to start an interactive study session.',
      "In Study Mode, flip each card then mark it as \"Got It\" or \"Still Learning\".",
      "Use keyboard shortcuts: Space to flip, → for Got It, ← for Still Learning, Esc to exit.",
      "After reviewing all cards, see your score and optionally review only the cards you missed.",
      "Spaced repetition is built in — cards you mark \"Still Learning\" reappear sooner during the session.",
      "For saved sessions, your progress is remembered across sessions using a Leitner box system (New → Learning → Familiar → Strong → Mastered).",
      "Harder cards (lower mastery) appear first when you start Study Mode, so you focus on what you need most.",
      "A mastery breakdown on the results screen shows how many cards are at each level.",
      'After completing a flashcard set, quiz, or practice test, click "Generate New Flashcards", "Generate New Quiz", or "Generate New Practice Test" to get a fresh set of different questions on the same material.',
      'You can also click "New Cards", "New Quiz", or "New Test" buttons in the tab headers to regenerate at any time.',
      'Click "Export PDF" on any saved session to download a printable PDF of your study materials.',
      "Choose which sections to include (summary, key terms, flashcards, quiz, practice test) before exporting.",
    ],
  },
  {
    title: "Practice Problems",
    icon: "🧮",
    description:
      "Step-by-step practice problems with progressive reveal — perfect for STEM courses and multi-step reasoning.",
    steps: [
      'When you generate study materials, a "Practice Problems" tab appears alongside your other study aids.',
      "Each problem has a difficulty badge (Easy, Medium, or Hard) so you can challenge yourself progressively.",
      'Click "Show First Step" to reveal the first step of the solution.',
      "Continue clicking to reveal each subsequent step one at a time — try solving it yourself before peeking!",
      "After all steps are revealed, the final answer is shown.",
      'Click "Hide Steps" to reset and try the problem again from scratch.',
      'Use the "New Problems" button to generate a fresh set of problems on the same material.',
      "Practice problems focus on calculation, analysis, and multi-step reasoning skills.",
    ],
  },
  {
    title: "Simplify It (ELI5 Mode)",
    icon: "💡",
    description:
      "Struggling with complex concepts? Toggle simplified explanations that use everyday analogies and simple language.",
    steps: [
      'In the Summary or Key Terms tab, click the "Simplify It" button in the top-right corner.',
      "The content switches to a simplified version using everyday language and fun analogies.",
      'Click "Show Original" to switch back to the full academic version at any time.',
      "For new study sessions, simplified versions are generated automatically.",
      'For older sessions that don\'t have simplified content yet, clicking "Simplify It" will generate it on demand.',
      "Simplified summaries are shown with purple bullet points to distinguish them from the originals.",
      "This feature is free for all users and works on any study session.",
    ],
  },
  {
    title: "Visual Diagrams",
    icon: "📊",
    description:
      "Generate AI-powered visual diagrams — mind maps, flowcharts, concept maps, and AI illustrations — from your study material.",
    steps: [
      'Click the "Visualize" tab in any study session.',
      'Choose a diagram type: Study Guide, Mind Map, Flowchart, Concept Map, or AI Illustration.',
      'Click "Generate Diagram" to create a visual from your summary and key terms.',
      "The AI generates valid diagram syntax and renders it as an interactive SVG in your browser.",
      "Mind Maps show topic hierarchy — great for seeing how subtopics branch from the main idea.",
      "Flowcharts show logical flow — useful for processes, decision trees, and step-by-step concepts.",
      "Concept Maps show relationships between terms — ideal for understanding how ideas connect.",
      'AI Illustration (Pro/Max only) has two modes: "Visualize Concept" generates a professional diagram from a text description, and "Clean Up Drawing" redraws a photo of your hand-drawn illustration as a polished, professional image.',
      "You can generate up to 5 AI illustrations per study session.",
      'Click "Regenerate" to get a different version of the same diagram type.',
      "A green dot on a diagram type button indicates it has already been generated.",
      "Diagrams and illustrations are saved to your session — come back later and they will still be there.",
    ],
  },
  {
    title: "AI Tutor Chat",
    icon: "💬",
    description:
      "Have an interactive conversation with an AI tutor about your study material. Ask follow-up questions, request different explanations, or quiz yourself.",
    steps: [
      'The "AI Tutor" tab appears in every study session.',
      "The AI tutor has full context of your study session — it knows your summary, key terms, and material.",
      "Type a question and hit Send to start a conversation.",
      "Ask for different explanations, real-world examples, or to quiz you on specific concepts.",
      "Your chat history is saved — come back later and continue where you left off.",
      "AI Tutor Chat is available on Pro and MAX plans. Free users will see an upgrade prompt.",
      'To upgrade, visit the Pricing page from the "AI Tutor" tab or your Profile.',
    ],
  },
  {
    title: "Create & Edit Flashcards / Quizzes",
    icon: "✏️",
    description:
      "Create your own flashcard and quiz sets from scratch, or edit AI-generated ones.",
    steps: [
      'On the Study Help page, click "Create your own" to start a blank study set.',
      "Enter a title and select a course for your new session.",
      'Use the "Flashcards" tab to add cards with a front (question) and back (answer).',
      'Use the "Quiz" tab to create multiple-choice questions with 4 options, a correct answer, and an explanation.',
      'Click "Save Session" when finished.',
      "To edit an existing session, open it from your history and click the pencil (edit) icon.",
      "You can add, remove, or modify flashcards and quiz questions, then save your changes.",
    ],
  },
  {
    title: "Share Study Sets",
    icon: "🔗",
    description:
      "Share your flashcard and quiz sets with classmates via a link.",
    steps: [
      "Open a study help session from your history.",
      "Click the share icon (arrow) to generate a shareable link.",
      "Copy the link and send it to classmates.",
      "Recipients must have a BlockPlan account to view shared study sets.",
      "Shared sessions are read-only — recipients can study with them but not edit.",
      'To stop sharing, click the share icon again and select "Stop sharing" to revoke the link.',
    ],
  },
  {
    title: "Courses",
    icon: "📚",
    description:
      "Manage your courses for the semester and see everything about each course in one place.",
    steps: [
      'Click "Courses" in the navigation bar.',
      'Click "Add Course" and enter the course name (e.g., "Math 105").',
      "Click on any course name to open its detail page — see all tasks, study sessions, and quick actions for that course.",
      "From the course detail page, use the quick action buttons to upload a syllabus, generate AI study help, or view all tasks — each pre-selects the course for you.",
      "Courses are used to organize your tasks, grades, and study materials.",
      "Deleting a course will remove it from all associated tasks.",
    ],
  },
  {
    title: "Upload Syllabus",
    icon: "📄",
    description:
      "Upload your course syllabus to automatically extract assignments and due dates.",
    steps: [
      'Click "Upload Syllabus" in the navigation bar.',
      "Select the course the syllabus belongs to.",
      "Upload your syllabus as a PDF, or snap a photo (PNG, JPG) of a printed syllabus and upload the image. Files up to 10 MB are supported.",
      "The system will analyze the document and extract assignments, exams, and due dates. Photos are read using AI vision.",
      'Review the extracted tasks on the review page — items marked "Needs review" may be general syllabus info rather than real assignments, so check those carefully.',
      "Edit any tasks that need corrections — fix titles, dates, or estimated times.",
      'Click "Confirm" to add the extracted tasks to your task list.',
    ],
  },
  {
    title: "Settings",
    icon: "⚙️",
    description:
      "Customize your BlockPlan experience — timezone, availability, and planner preferences.",
    steps: [
      'Click "Settings" in the navigation bar.',
      "Set your timezone so study blocks and due dates display correctly.",
      "Configure your available study hours by adding availability rules (day, start time, end time).",
      "Under Planner Preferences, set Max Block Length (longest single study session, 25–120 min).",
      "Set Min Block Length (shortest block worth scheduling, 15–60 min).",
      "Set Buffer Time Between Blocks (rest between sessions, 0–30 min).",
      'Enable "Backward Planning" to spread work evenly across days leading up to each due date, instead of front-loading.',
      "These settings are used by the plan generator when scheduling study blocks.",
      'Use the "Delete Account" section at the bottom to permanently remove your account and all data.',
    ],
  },
  {
    title: "Getting Started (New Users)",
    icon: "🚀",
    description:
      "Quick start guide for setting up BlockPlan for the first time.",
    steps: [
      "Sign in with your account (or create one on the auth page).",
      "Complete the onboarding flow — set your timezone and study preferences.",
      "A guided tour will automatically start on your first visit to the Dashboard — follow along to learn the key features, or skip it if you prefer.",
      'Go to Courses and add your classes for the semester (e.g., "English 206", "Math 105").',
      "Upload your syllabi (PDF or photo) to auto-import assignments, or manually add tasks on the Tasks page.",
      "Set due dates and estimated time for each task.",
      'Go to the Calendar and click "Generate Plan" to create your study schedule.',
      "Check your Dashboard daily to see what's coming up and track your progress.",
      "Mark tasks as completed and blocks as done as you work through them.",
    ],
  },
  {
    title: "Feedback",
    icon: "💬",
    description:
      "Help us improve BlockPlan by sharing your thoughts.",
    steps: [
      'Click "Feedback" in the navigation bar.',
      "Rate your experience from 1 to 5 stars.",
      "Write a message describing what you like, what could be better, or any issues you encountered.",
      "Click Send Feedback — your feedback goes directly to the development team.",
    ],
  },
  {
    title: "Mobile Tips",
    icon: "📱",
    description:
      "BlockPlan is designed to work great on your phone. Here are some tips for the best mobile experience.",
    steps: [
      "Use the hamburger menu (three lines) in the top-right to navigate between pages on mobile. Tap outside the menu to close it.",
      "Flashcards and study mode are optimized for phone screens — swipe through cards and tap to flip.",
      "All buttons and interactive elements are sized for easy tapping — no need to pinch and zoom.",
      "The calendar defaults to a single-column view on mobile so you can see your full schedule without scrolling sideways.",
      "Quick actions on the Dashboard stack vertically on smaller screens for easier tapping.",
      "Delete buttons on notes and tasks are always visible on touch screens (no hover required).",
    ],
  },
];

export const metadata: Metadata = {
  title: "Help | BlockPlan",
  description: "Learn how to use BlockPlan",
};

export default function HelpPage() {
  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Help & User Guide
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Everything you need to know about using BlockPlan — your academic
            planner for BYU-Idaho.
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
                key={s.title}
                href={`#${s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                {s.icon} {s.title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.title}
              id={section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
              className="scroll-mt-20 rounded-xl border border-gray-200 bg-white p-6 shadow-[var(--shadow-card)]"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">{section.icon}</span>
                <h2 className="text-lg font-semibold text-gray-900">
                  {section.title}
                </h2>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                {section.description}
              </p>
              <ol className="space-y-2">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-700">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm text-gray-500">
            BlockPlan is built for BYU-Idaho students to stay on top of their
            coursework. Have questions or suggestions?{" "}
            <a href="/feedback" className="font-medium text-blue-600 hover:text-blue-700">
              Send us feedback
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
