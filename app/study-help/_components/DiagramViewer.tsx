"use client";

import { useState } from "react";
import type { Diagram, DiagramType, Illustration } from "@/lib/study-help/types";
import MermaidDiagram from "./MermaidDiagram";
import InfographicView from "./InfographicView";
import IllustrationViewer from "./IllustrationViewer";

const DIAGRAM_TYPES: { key: DiagramType; label: string }[] = [
  { key: "infographic", label: "Study Guide" },
  { key: "mindmap", label: "Mind Map" },
  { key: "flowchart", label: "Flowchart" },
  { key: "conceptMap", label: "Concept Map" },
  { key: "illustration", label: "AI Illustration" },
];

export default function DiagramViewer({
  diagrams,
  illustrations,
  onGenerate,
  onGenerateIllustration,
  isGenerating,
  isGeneratingIllustration,
  userPlan,
  illustrationUsage,
}: {
  diagrams: Diagram[];
  illustrations?: Illustration[];
  onGenerate?: (type: DiagramType) => Promise<void>;
  onGenerateIllustration?: (mode: "cleanup" | "visualize", input: string) => Promise<void>;
  isGenerating?: boolean;
  isGeneratingIllustration?: boolean;
  userPlan?: string;
  illustrationUsage?: { used: number; limit: number };
}) {
  const [selectedType, setSelectedType] = useState<DiagramType>("infographic");

  const currentDiagram = diagrams.find((d) => d.type === selectedType);

  return (
    <div className="space-y-4">
      {/* Diagram type selector */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {DIAGRAM_TYPES.map(({ key, label }) => {
          const hasData = key === "illustration"
            ? (illustrations?.length ?? 0) > 0
            : diagrams.some((d) => d.type === key);
          return (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={[
                "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                selectedType === key
                  ? key === "illustration" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200",
              ].join(" ")}
            >
              {label}
              {hasData && (
                <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 sm:ml-1.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Illustration tab */}
      {selectedType === "illustration" ? (
        <IllustrationViewer
          illustrations={illustrations ?? []}
          onGenerate={onGenerateIllustration}
          isGenerating={isGeneratingIllustration}
          userPlan={userPlan}
          illustrationUsage={illustrationUsage}
        />
      ) : currentDiagram ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {currentDiagram.title}
            </h3>
            {onGenerate && (
              <button
                onClick={() => onGenerate(selectedType)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                {isGenerating ? "Regenerating..." : "Regenerate"}
              </button>
            )}
          </div>
          {currentDiagram.type === "infographic" ? (
            <InfographicView json={currentDiagram.mermaidCode} />
          ) : (
            <MermaidDiagram
              code={currentDiagram.mermaidCode}
              id={`${currentDiagram.type}-${Date.now()}`}
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center sm:p-8">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
            <svg
              className="h-6 w-6 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700">
            No{" "}
            {DIAGRAM_TYPES.find((t) => t.key === selectedType)?.label.toLowerCase()}{" "}
            generated yet
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {selectedType === "infographic"
              ? "AI will create a colorful visual study guide from your material"
              : "AI will create a visual diagram from your study material"}
          </p>
          {onGenerate && (
            <button
              onClick={() => onGenerate(selectedType)}
              disabled={isGenerating}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                "Generate Diagram"
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
