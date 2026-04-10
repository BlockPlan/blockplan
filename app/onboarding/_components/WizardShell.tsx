"use client";

import { useCallback, useState } from "react";
import StepTerm from "./StepTerm";
import StepCourses from "./StepCourses";
import StepAvailability from "./StepAvailability";
import StepNextAction from "./StepNextAction";
import type { AvailabilityRule } from "@/lib/validations/availability";

type Course = {
  id: string;
  name: string;
  meeting_times: unknown;
};

type WizardShellProps = {
  initialStep: number;
  termId: string | null;
  courses: Course[];
  availabilityRules: AvailabilityRule[];
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
  availabilityRules,
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

  const handleCourseAdded = useCallback((course: Course) => {
    setCurrentCourses((prev) =>
      prev.some((c) => c.id === course.id) ? prev : [...prev, course]
    );
  }, []);

  const handleCourseDeleted = useCallback((courseId: string) => {
    setCurrentCourses((prev) => prev.filter((c) => c.id !== courseId));
  }, []);

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
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
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
                      "mx-2 mt-[-18px] h-0.5 flex-1 transition-colors duration-300",
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
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-[var(--shadow-card)] sm:p-8">
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
          <StepAvailability
            initialRules={availabilityRules}
            courses={currentCourses}
            onNext={() => setCurrentStep(4)}
          />
        )}
        {currentStep === 4 && <StepNextAction />}
      </div>
    </div>
  );
}
