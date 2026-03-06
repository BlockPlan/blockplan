"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import TourTooltip from "./TourTooltip";

// ---------------------------------------------------------------------------
// Tour steps
// ---------------------------------------------------------------------------

export interface TourStep {
  target: string; // data-tour attribute value
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "dashboard-welcome",
    title: "Your Dashboard",
    description:
      "This is your home base. See your progress, upcoming tasks, and GPA at a glance.",
    position: "bottom",
  },
  {
    target: "nav-calendar",
    title: "Plan Your Week",
    description:
      "Click Calendar to see your weekly schedule. Hit 'Generate Plan' to auto-schedule study blocks.",
    position: "bottom",
  },
  {
    target: "nav-tasks",
    title: "Track Your Tasks",
    description:
      "Add assignments, exams, and readings here. Set due dates and the planner will schedule them.",
    position: "bottom",
  },
  {
    target: "nav-upload-syllabus",
    title: "Upload Your Syllabus",
    description:
      "Upload a PDF of your syllabus to auto-import all your assignments.",
    position: "bottom",
  },
  {
    target: "nav-study-help",
    title: "AI Study Help",
    description:
      "Get AI-generated flashcards, quizzes, and summaries for any topic.",
    position: "bottom",
  },
  {
    target: "quick-notes",
    title: "Quick Notes",
    description:
      "Jot down reminders and thoughts right from your dashboard.",
    position: "top",
  },
];

const STORAGE_KEY = "blockplan_tour_complete";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TourContextValue {
  isTourActive: boolean;
  currentStep: number;
  nextStep: () => void;
  skipTour: () => void;
}

const TourContext = createContext<TourContextValue>({
  isTourActive: false,
  currentStep: 0,
  nextStep: () => {},
  skipTour: () => {},
});

export function useTour() {
  return useContext(TourContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export default function TourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [currentStep, setCurrentStep] = useState(0);
  const [isTourActive, setIsTourActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only activate on dashboard after mount
  useEffect(() => {
    setMounted(true);
    if (pathname === "/dashboard") {
      const completed = localStorage.getItem(STORAGE_KEY);
      if (!completed) {
        // Small delay to let the page render and elements mount
        const timer = setTimeout(() => setIsTourActive(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [pathname]);

  const completeTour = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsTourActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) {
      completeTour();
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [currentStep, completeTour]);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  const value: TourContextValue = {
    isTourActive,
    currentStep,
    nextStep,
    skipTour,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      {mounted && isTourActive && (
        <TourTooltip
          step={TOUR_STEPS[currentStep]}
          stepIndex={currentStep}
          totalSteps={TOUR_STEPS.length}
          onNext={nextStep}
          onSkip={skipTour}
        />
      )}
    </TourContext.Provider>
  );
}
