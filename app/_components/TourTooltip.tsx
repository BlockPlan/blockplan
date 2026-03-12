"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { TourStep } from "./TourProvider";

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export default function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onSkip,
}: TourTooltipProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [visible, setVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Find target element and measure its position
  useEffect(() => {
    setVisible(false);
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      // If element not found, skip this step
      onNext();
      return;
    }

    // If element is hidden (e.g. desktop nav links on mobile), skip this step
    const elRect = el.getBoundingClientRect();
    if (elRect.width === 0 && elRect.height === 0) {
      onNext();
      return;
    }

    // Scroll element into view if needed
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Small delay to let scroll finish
    const timer = setTimeout(() => {
      setRect(el.getBoundingClientRect());
      setVisible(true);
    }, 350);

    return () => clearTimeout(timer);
  }, [step.target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recalculate on resize/scroll
  useEffect(() => {
    if (!rect) return;

    const update = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) setRect(el.getBoundingClientRect());
    };

    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [rect, step.target]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onSkip();
      if (e.key === "Enter" || e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onNext, onSkip]);

  if (!rect) return null;

  // Calculate tooltip position
  const padding = 8;
  const tooltipGap = 12;
  const tooltipWidth = 288; // w-72 = 18rem = 288px
  const screenMargin = 16;
  let top = 0;
  let left = 0;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const vw = typeof window !== "undefined" ? window.innerWidth : 400;

  switch (step.position) {
    case "bottom":
      top = rect.bottom + tooltipGap;
      left = centerX;
      break;
    case "top":
      top = rect.top - tooltipGap;
      left = centerX;
      break;
    case "left":
      top = centerY;
      left = rect.left - tooltipGap;
      break;
    case "right":
      top = centerY;
      left = rect.right + tooltipGap;
      break;
  }

  // On mobile, for top/bottom positioned tooltips, clamp left so the
  // tooltip stays fully on-screen instead of using translateX(-50%)
  const isVertical = step.position === "bottom" || step.position === "top";
  const effectiveWidth = Math.min(tooltipWidth, vw - screenMargin * 2);
  let clampedLeft = left;
  if (isVertical) {
    const halfW = effectiveWidth / 2;
    clampedLeft = Math.max(screenMargin + halfW, Math.min(left, vw - screenMargin - halfW));
  }

  const isLast = stepIndex === totalSteps - 1;

  return createPortal(
    <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">
      {/* Backdrop overlay with cutout */}
      <svg
        className="absolute inset-0 h-full w-full"
        style={{ transition: "opacity 300ms ease-in-out", opacity: visible ? 1 : 0 }}
      >
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.45)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Highlight ring around target */}
      <div
        className="pointer-events-none absolute rounded-lg ring-2 ring-blue-500 ring-offset-2"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
          transition: "all 300ms ease-in-out",
          opacity: visible ? 1 : 0,
        }}
      />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        className="absolute z-10 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-4 shadow-xl"
        style={{
          top,
          left: isVertical ? clampedLeft : Math.max(screenMargin, Math.min(left, vw - screenMargin)),
          transform:
            step.position === "bottom"
              ? "translateX(-50%)"
              : step.position === "top"
              ? "translateX(-50%) translateY(-100%)"
              : step.position === "left"
              ? "translateX(-100%) translateY(-50%)"
              : "translateY(-50%)",
          transition: "opacity 300ms ease-in-out, transform 300ms ease-in-out",
          opacity: visible ? 1 : 0,
        }}
      >
        {/* Arrow — follows the target element, not always centered */}
        <div
          className="absolute h-3 w-3 rotate-45 bg-white"
          style={
            step.position === "bottom"
              ? { top: -6, left: `calc(50% + ${left - clampedLeft}px)`, marginLeft: -6 }
              : step.position === "top"
              ? { bottom: -6, left: `calc(50% + ${left - clampedLeft}px)`, marginLeft: -6 }
              : step.position === "left"
              ? { right: -6, top: "50%", marginTop: -6 }
              : { left: -6, top: "50%", marginTop: -6 }
          }
        />

        {/* Step counter */}
        <p className="mb-1 text-xs font-medium text-blue-600">
          {stepIndex + 1} of {totalSteps}
        </p>

        {/* Title and description */}
        <h3 className="mb-1 text-sm font-semibold text-gray-900">
          {step.title}
        </h3>
        <p className="mb-4 text-sm text-gray-600">{step.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 transition-colors hover:text-gray-600"
          >
            Skip tour
          </button>
          <button
            onClick={onNext}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
