"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createIllustrationSession,
  generateIllustrationForSession,
  getIllustrationUsageInfo,
} from "@/app/study-help/actions";
import type { Illustration } from "@/lib/study-help/types";
import type { SubscriptionPlan } from "@/lib/subscription";

interface Course {
  id: string;
  name: string;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_ILLUSTRATIONS = 5;

export default function IllustratePage({
  courses,
  initialCourseId,
  userPlan,
}: {
  courses: Course[];
  initialCourseId?: string;
  userPlan: SubscriptionPlan;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"visualize" | "cleanup">("visualize");
  const [conceptText, setConceptText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [illustrations, setIllustrations] = useState<Illustration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usageInfo, setUsageInfo] = useState<{ used: number; limit: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = userPlan !== "free";
  const freeUsedUp = !isPro && usageInfo && usageInfo.used >= usageInfo.limit;
  const atLimit = illustrations.length >= MAX_ILLUSTRATIONS || !!freeUsedUp;

  useEffect(() => {
    getIllustrationUsageInfo().then((info) => {
      if (info.limit !== Infinity) {
        setUsageInfo({ used: info.used, limit: info.limit });
      }
    });
  }, [illustrations]);

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

  const handleGenerate = useCallback(async () => {
    setError(null);

    const input = mode === "visualize" ? conceptText.trim() : uploadedImage;
    if (!input) {
      setError(mode === "visualize"
        ? "Please describe the concept you want to visualize."
        : "Please upload an image to clean up.");
      return;
    }

    setIsGenerating(true);
    try {
      if (!sessionId) {
        // First illustration — create a new session
        const result = await createIllustrationSession(
          mode,
          input,
          courseId || undefined
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.sessionId && result.illustration) {
          setSessionId(result.sessionId);
          setIllustrations([result.illustration]);
          toast.success("Illustration generated!");
        }
      } else {
        // Subsequent illustrations — add to existing session
        const result = await generateIllustrationForSession(
          sessionId,
          mode,
          input
        );
        if (result.error) {
          setError(result.error);
          return;
        }
        if (result.illustration) {
          setIllustrations((prev) => [...prev, result.illustration!]);
          toast.success("Illustration generated!");
        }
      }

      // Reset inputs
      if (mode === "visualize") setConceptText("");
      if (mode === "cleanup") {
        setUploadedImage(null);
        setUploadedFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } finally {
      setIsGenerating(false);
    }
  }, [mode, conceptText, uploadedImage, sessionId, courseId]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">AI Illustration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate professional visuals from text descriptions or clean up hand-drawn diagrams.
        </p>
        <div className="mt-2">
          <a href="/study-help" className="text-sm text-blue-600 hover:underline">
            &larr; Back to Study Help
          </a>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setMode("visualize")}
          className={[
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
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
            "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            mode === "cleanup"
              ? "bg-purple-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          ].join(" ")}
        >
          Clean Up Drawing
        </button>
        {(illustrations.length > 0 || usageInfo) && (
          <span className="ml-auto text-xs text-gray-400">
            {usageInfo
              ? `${usageInfo.used} of ${usageInfo.limit} free illustrations used`
              : `${illustrations.length} of ${MAX_ILLUSTRATIONS} this session`}
          </span>
        )}
      </div>

      {/* Course selector */}
      {courses.length > 0 && (
        <div className="mb-4">
          <label htmlFor="courseId" className="mb-1 block text-sm font-medium text-gray-700">
            Course <span className="text-gray-400">(optional)</span>
          </label>
          <select
            id="courseId"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="input cursor-pointer"
          >
            <option value="">No course selected</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Input area */}
      {!atLimit && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          {mode === "visualize" ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Describe the concept to visualize
              </label>
              <textarea
                value={conceptText}
                onChange={(e) => setConceptText(e.target.value)}
                placeholder="e.g., The water cycle, Photosynthesis process, Supply and demand curve, or paste a paragraph from your textbook..."
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                disabled={isGenerating}
              />
              <p className="mt-1 text-xs text-gray-400">
                Be specific — include what type of diagram, labels, and relationships you want shown. You can also paste a block of text from your textbook.
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
                    className="max-h-64 rounded-lg border border-gray-200 object-contain"
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
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500 transition-colors hover:border-purple-400 hover:text-purple-600"
                  disabled={isGenerating}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                AI will redraw your illustration as a clean, professional, textbook-quality diagram.
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
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
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
          {isGenerating && (
            <p className="mt-2 text-sm text-gray-500">
              This may take a minute — AI is creating a detailed illustration.
            </p>
          )}
        </div>
      )}

      {atLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          {freeUsedUp ? (
            <>
              <p className="text-sm font-medium text-amber-800">
                You&apos;ve used all {usageInfo?.limit} free illustrations
              </p>
              <p className="mt-1 text-xs text-amber-600">
                Upgrade to Pro for unlimited AI illustrations.
              </p>
              <a
                href="/pricing"
                className="mt-3 inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Upgrade to Pro
              </a>
            </>
          ) : (
            <p className="text-sm text-amber-700">
              Maximum of {MAX_ILLUSTRATIONS} illustrations per session reached.
            </p>
          )}
        </div>
      )}

      {/* Generated illustrations */}
      {illustrations.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              Generated Illustrations
            </h2>
            {sessionId && (
              <a
                href={`/study-help/${sessionId}`}
                className="text-sm text-blue-600 hover:underline"
              >
                View full session &rarr;
              </a>
            )}
          </div>
          <p className="text-xs text-gray-400">
            AI-generated illustrations may contain spelling errors or inaccurate label placement. Always verify details. Click &quot;Regenerate&quot; to try again.
          </p>
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
                  <div className="mt-1 flex items-center justify-between">
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
                    {!atLimit && (
                      <button
                        onClick={() => {
                          if (ill.mode === "visualize") {
                            setConceptText(ill.prompt);
                            setMode("visualize");
                          }
                          handleGenerate();
                        }}
                        disabled={isGenerating}
                        className="text-xs font-medium text-purple-600 hover:text-purple-700 disabled:opacity-50"
                      >
                        Regenerate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved session link */}
      {sessionId && illustrations.length > 0 && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
          <p className="text-sm text-green-700">
            &#10003; Illustrations saved to{" "}
            <a href="/study-help/history" className="font-medium underline">
              history
            </a>
            {" "}&#183;{" "}
            <a href={`/study-help/${sessionId}`} className="font-medium underline">
              View session
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
