import NavHeader from "@/app/plan/_components/NavHeader";

const sections = [
  {
    title: "Dashboard",
    icon: "📊",
    description:
      "Your home base. See an overview of your academic progress at a glance.",
    steps: [
      "Navigate to the Dashboard tab — it loads automatically after sign-in.",
      "View your overall task completion progress (blue bar) and today's study block progress (green bar).",
      "Check your current GPA in the purple card (appears once you've entered grades).",
      'See your next scheduled study block under "Next Up".',
      'Review your top 5 upcoming tasks sorted by due date under "Top Priorities".',
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
      "Plan your study schedule with a visual weekly calendar. Blocks of study time are automatically generated for your tasks.",
    steps: [
      'Click "Calendar" in the navigation bar.',
      "Toggle between Day, Week, and Month views using the buttons in the top-right.",
      'Click "Generate Plan" to auto-schedule study blocks based on your tasks and available time.',
      'Click "Export to Calendar" to download an .ics file for Google Calendar or Apple Calendar.',
      "Click any study block to mark it as done (checkmark), edit (pencil), or cancel (X).",
      "Done blocks turn green, missed blocks turn red.",
      "To undo a done or missed block, click the undo arrow (↩) that appears on the block.",
      "Click on any task name within a block to open the edit dialog directly from the calendar.",
      "In Month view, colored dots and status icons show your schedule density and completion.",
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
      "Optionally set grading info (points possible, weight, grade earned) for GPA tracking.",
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
    title: "Grades & GPA",
    icon: "🎓",
    description:
      "Track your grades per assignment and see your projected GPA across all courses.",
    steps: [
      'Click "Grades" in the navigation bar.',
      "Your overall GPA is shown at the top of the page.",
      "Each course is displayed as an expandable card showing your current letter grade and weighted average.",
      "Click a course card to expand it and see all graded assignments.",
      "Enter grades inline — type the score earned for each assignment and click Save.",
      "To set up grading weights: when creating/editing a task, fill in Points Possible and Weight.",
      'Click "Customize Scale" on a course card to adjust letter grade thresholds (e.g., change A to 94% instead of 93%).',
      "GPA is calculated on a 4.0 scale: A=4.0, A-=3.7, B+=3.3, etc.",
      "Your GPA also appears on the Dashboard when you have graded assignments.",
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
      "Select a course and topic to study.",
      "The AI generates a summary, key terms, flashcards, multiple-choice quiz, and practice test questions.",
      'You can also start a study session from the Tasks page — click the "Study" link next to any exam or reading task.',
      "Study sessions are tailored to your course content and uploaded syllabus materials.",
      'Click "Save Session" to keep a study set for later review.',
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
      'Click "Export PDF" on any saved session to download a printable PDF of your study materials.',
      "Choose which sections to include (summary, key terms, flashcards, quiz, practice test) before exporting.",
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
      "Manage your courses for the semester.",
    steps: [
      'Click "Courses" in the navigation bar.',
      'Click "Add Course" and enter the course name (e.g., "Math 105").',
      "Courses are used to organize your tasks, grades, and study materials.",
      "Each course can have a custom grading scale (edit from the Grades page).",
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
      "Upload your syllabus file (PDF or image).",
      "The system will analyze the document and extract assignments, exams, and due dates.",
      'Review the extracted tasks on the review page — edit any that need corrections.',
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
      "Upload your syllabi to auto-import assignments, or manually add tasks on the Tasks page.",
      "Set due dates and estimated time for each task.",
      'Go to the Calendar and click "Generate Plan" to create your study schedule.',
      "Check your Dashboard daily to see what's coming up and track your progress.",
      "Mark tasks as completed and blocks as done as you work through them.",
      "Enter grades as you get them back to track your GPA.",
    ],
  },
  {
    title: "Mobile Tips",
    icon: "📱",
    description:
      "BlockPlan is designed to work great on your phone. Here are some tips for the best mobile experience.",
    steps: [
      "Use the hamburger menu (three lines) in the top-right to navigate between pages on mobile.",
      "Flashcards and study mode are optimized for phone screens — swipe through cards and tap to flip.",
      "All buttons and interactive elements are sized for easy tapping — no need to pinch and zoom.",
      "The calendar defaults to a single-column view on mobile so you can see your full schedule without scrolling sideways.",
      "Quick actions on the Dashboard stack vertically on smaller screens for easier tapping.",
      "Delete buttons on notes and tasks are always visible on touch screens (no hover required).",
    ],
  },
];

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
            coursework. If you have questions or feedback, reach out to your
            instructor or the development team.
          </p>
        </div>
      </main>
    </div>
  );
}
