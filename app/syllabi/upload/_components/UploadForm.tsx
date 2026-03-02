"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ParsedItem } from "@/lib/syllabus/types";

interface Course {
  id: string;
  name: string;
}

interface UploadFormProps {
  courses: Course[];
}

type UploadStatus = "idle" | "uploading" | "extracting" | "error";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function UploadForm({ courses }: UploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setErrorMessage(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage("File is too large. Maximum size is 10 MB.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a PDF file.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setFile(selected);
  }

  async function handleUpload() {
    if (!selectedCourseId || !file || status !== "idle") return;

    setStatus("uploading");
    setProgress(0);
    setErrorMessage(null);

    try {
      // Step 1: Get a signed upload URL
      const urlResponse = await fetch("/api/syllabi/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: selectedCourseId, filename: file.name }),
      });

      if (!urlResponse.ok) {
        const data = await urlResponse.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Failed to get upload URL"
        );
      }

      const { signedUrl, path: storagePath } = (await urlResponse.json()) as {
        signedUrl: string;
        path: string;
        token: string;
      };

      // Step 2: Upload file directly to Supabase Storage using XMLHttpRequest
      // to track upload progress (bypasses Vercel's 4.5 MB body limit)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.open("PUT", signedUrl);
        xhr.setRequestHeader("Content-Type", "application/pdf");
        xhr.send(file);
      });

      setProgress(100);

      // Step 3: Trigger extraction
      setStatus("extracting");

      const extractResponse = await fetch("/api/syllabi/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath, courseId: selectedCourseId }),
      });

      if (extractResponse.status === 422) {
        // Scanned/image PDF — show clear message
        const data = await extractResponse.json() as { error: string; message: string };
        setStatus("error");
        setErrorMessage(data.message);
        return;
      }

      if (!extractResponse.ok) {
        const data = await extractResponse.json().catch(() => ({})) as { message?: string };
        setStatus("error");
        setErrorMessage(
          data.message ??
            "Failed to process syllabus. Please try again or enter tasks manually."
        );
        return;
      }

      const extractData = await extractResponse.json() as {
        items: ParsedItem[];
        totalPages: number;
        llmUsed: boolean;
      };

      // Step 4: Store parsed items in sessionStorage and navigate to review
      sessionStorage.setItem(
        `parsedItems-${selectedCourseId}`,
        JSON.stringify(extractData.items)
      );

      router.push(`/syllabi/review?course_id=${selectedCourseId}`);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
    }
  }

  function handleRetry() {
    setStatus("idle");
    setProgress(0);
    setErrorMessage(null);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const isDisabled =
    !selectedCourseId || !file || status === "uploading" || status === "extracting";

  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(1) : null;

  return (
    <div className="space-y-6">
      {/* Course selector */}
      <div>
        <label
          htmlFor="course-select"
          className="block text-sm font-medium text-gray-700"
        >
          Course
        </label>
        <select
          id="course-select"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          disabled={status === "uploading" || status === "extracting"}
          className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 sm:text-sm"
        >
          <option value="">Select a course…</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* File input */}
      <div>
        <label
          htmlFor="file-input"
          className="block text-sm font-medium text-gray-700"
        >
          Syllabus PDF
        </label>
        <div className="mt-1.5">
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={status === "uploading" || status === "extracting"}
            className="block w-full text-sm text-gray-500 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Selected file info */}
        {file && (
          <p className="mt-1.5 text-xs text-gray-500">
            {file.name}{" "}
            <span className="text-gray-400">({fileSizeMB} MB)</span>
          </p>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{errorMessage}</p>
          {status === "error" && (
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={handleRetry}
                className="text-sm font-medium text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
              <a
                href="/tasks"
                className="text-sm font-medium text-gray-600 underline hover:text-gray-800"
              >
                Add tasks manually
              </a>
            </div>
          )}
        </div>
      )}

      {/* Upload progress */}
      {status === "uploading" && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm text-gray-600">Uploading…</span>
            <span className="text-sm font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      )}

      {/* Extracting spinner */}
      {status === "extracting" && (
        <div className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <svg
            className="h-5 w-5 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
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
          <span className="text-sm font-medium text-blue-700">
            Parsing your syllabus…
          </span>
        </div>
      )}

      {/* Upload button */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={isDisabled}
        className={[
          "w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          isDisabled
            ? "cursor-not-allowed bg-gray-100 text-gray-400"
            : "bg-blue-600 text-white hover:bg-blue-700",
        ].join(" ")}
      >
        {status === "uploading"
          ? "Uploading…"
          : status === "extracting"
            ? "Parsing…"
            : "Upload & Parse"}
      </button>
    </div>
  );
}
