"use client";

import { useState, useRef } from "react";
import type { Illustration } from "@/lib/study-help/types";

const MAX_ILLUSTRATIONS = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

interface IllustrationViewerProps {
  illustrations: Illustration[];
  onGenerate?: (mode: "cleanup" | "visualize", input: string) => Promise<void>;
  isGenerating?: boolean;
  userPlan?: string;
}

export default function IllustrationViewer({
  illustrations,
  onGenerate,
  isGenerating,
  userPlan = "free",
}: IllustrationViewerProps) {
  const [mode, setMode] = useState<"visualize" | "cleanup">("visualize");
  const [conceptText, setConceptText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = userPlan !== "free";
  const atLimit = illustrations.length >= MAX_ILLUSTRATIONS;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setError("Please upload a PNG or JPG image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be under 10 MB.");
      return;
    }

    setError(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!onGenerate) return;
    setError(null);

    if (mode === "visualize") {
      if (!conceptText.trim()) {
        setError("Please describe the concept you want to visualize.");
        return;
      }
      await onGenerate("visualize", conceptText.trim());
      setConceptText("");
    } else {
      if (!uploadedImage) {
        setError("Please upload an image to clean up.");
        return;
      }
      await onGenerate("cleanup", uploadedImage);
      setUploadedImage(null);
      setUploadedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Free user gate
  if (!isPro) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center sm:p-8">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50">
          <svg className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700">AI Illustrations</p>
        <p className="mt-1 text-xs text-gray-500">
          Generate professional visuals from text or clean up hand-drawn diagrams.
        </p>
        <p className="mt-3 text-xs text-purple-600 font-medium">
          Available on Pro and Max plans
        </p>
        <a
          href="/pricing"
          className="mt-3 inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
        >
          Upgrade to Pro
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMode("visualize")}
          className={[
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "visualize"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          ].join(" ")}
        >
          Visualize Concept
        </button>
        <button
          onClick={() => setMode("cleanup")}
          className={[
            "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "cleanup"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          ].join(" ")}
        >
          Clean Up Drawing
        </button>
        <span className="ml-auto text-xs text-gray-400">
          {illustrations.length} of {MAX_ILLUSTRATIONS} used
        </span>
      </div>

      {/* Input area */}
      {!atLimit && onGenerate && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          {mode === "visualize" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Describe a concept to visualize
              </label>
              <textarea
                value={conceptText}
                onChange={(e) => setConceptText(e.target.value)}
                placeholder="e.g., The water cycle, Photosynthesis process, Supply and demand curve..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                disabled={isGenerating}
              />
              <p className="mt-1 text-xs text-gray-400">
                Be specific — include what type of diagram, labels, and relationships you want shown.
              </p>
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Upload a hand-drawn illustration
              </label>
              {uploadedImage ? (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded drawing"
                    className="max-h-48 rounded-lg border border-gray-200 object-contain"
                  />
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setUploadedFileName(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="mt-1 text-xs text-gray-500">{uploadedFileName}</p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 transition-colors hover:border-purple-400 hover:text-purple-600"
                  disabled={isGenerating}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  Click to upload a photo of your drawing (PNG, JPG)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="mt-1 text-xs text-gray-400">
                AI will redraw your illustration as a clean, professional diagram.
              </p>
            </div>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}

          <button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              (mode === "visualize" && !conceptText.trim()) ||
              (mode === "cleanup" && !uploadedImage)
            }
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : mode === "visualize" ? (
              "Generate Illustration"
            ) : (
              "Clean Up Drawing"
            )}
          </button>
        </div>
      )}

      {atLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-sm text-amber-700">
            Maximum of {MAX_ILLUSTRATIONS} illustrations per session reached.
          </p>
        </div>
      )}

      {/* Generated illustrations grid */}
      {illustrations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Generated Illustrations
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {illustrations.map((ill) => (
              <div
                key={ill.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              >
                <img
                  src={ill.imageUrl}
                  alt={ill.prompt}
                  className="w-full object-contain"
                />
                <div className="border-t border-gray-100 px-3 py-2">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {ill.prompt}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={[
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                        ill.mode === "visualize"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700",
                      ].join(" ")}
                    >
                      {ill.mode === "visualize" ? "Visualize" : "Cleanup"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
