"use client";

import { useState } from "react";
import StepTerm from "./StepTerm";
import StepCourses from "./StepCourses";

type Course = {
  id: string;
  name: string;
  meeting_times: unknown;
};

type WizardShellProps = {
  initialStep: number;
  termId: string | null;
  courses: Course[];
};

const STEPS = [
  { number: 1, label: "Term" },
  { number: 2, label: "Courses" },
  { number: 3, label: "Availability" },
  { number: 4, label: "Next Steps" },
];

export default function WizardShell({
  initialStep,
  termId,
  courses,
}: WizardShellProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [currentTermId, setCurrentTermId] = useState<string | null>(termId);
  const [currentCourses, setCurrentCourses] = useState<Course[]>(courses);

  function handleTermCreated(newTermId: string) {
    setCurrentTermId(newTermId);
    setCurrentStep(2);
  }

  function handleCoursesNext() {
    setCurrentStep(3);
  }

  function handleCourseAdded(course: Course) {
    setCurrentCourses((prev) => [...prev, course]);
  }

  function handleCourseDeleted(courseId: string) {
    setCurrentCourses((prev) => prev.filter((c) => c.id !== courseId));
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Indicator */}
      <nav aria-label="Wizard progress" className="mb-8">
        <ol className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            const isUpcoming = currentStep < step.number;

            return (
              <li key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isCompleted
                        ? "bg-blue-600 text-white"
                        : isCurrent
                          ? "border-2 border-blue-600 bg-white text-blue-600"
                          : "border-2 border-gray-200 bg-white text-gray-400",
                    ].join(" ")}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <svg
                        className="h-4 w-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={[
                      "mt-1.5 text-xs font-medium",
                      isCurrent
                        ? "text-blue-600"
                        : isUpcoming
                          ? "text-gray-400"
                          : "text-gray-600",
                    ].join(" ")}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={[
                      "mx-2 mt-[-18px] h-0.5 flex-1 transition-colors",
                      currentStep > step.number
                        ? "bg-blue-600"
                        : "bg-gray-200",
                    ].join(" ")}
                    aria-hidden="true"
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Content */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        {currentStep === 1 && (
          <StepTerm onSuccess={handleTermCreated} />
        )}
        {currentStep === 2 && currentTermId && (
          <StepCourses
            termId={currentTermId}
            existingCourses={currentCourses}
            onNext={handleCoursesNext}
            onCourseAdded={handleCourseAdded}
            onCourseDeleted={handleCourseDeleted}
          />
        )}
        {currentStep === 3 && (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Set Your Availability
            </h2>
            <p className="text-gray-500">
              Availability setup is coming soon. You will be able to set your
              weekly study windows and blocked times here.
            </p>
            <button
              onClick={() => setCurrentStep(4)}
              className="mt-6 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Continue
            </button>
          </div>
        )}
        {currentStep === 4 && (
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              You are all set!
            </h2>
            <p className="text-gray-500">
              Your term and courses are ready. Start by adding tasks manually
              or upload a syllabus to get started.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <a
                href="/tasks"
                className="rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Tasks Manually
              </a>
              <button
                disabled
                className="rounded-md border border-gray-200 px-6 py-2.5 text-sm font-semibold text-gray-400 cursor-not-allowed"
                title="Coming in Phase 3"
              >
                Upload Syllabus (Coming Soon)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
