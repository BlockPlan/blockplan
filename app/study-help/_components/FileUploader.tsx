"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UploadedFile {
  filename: string;
  storagePath: string;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

interface FileUploaderProps {
  onFilesChange: (paths: string[]) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/jpg",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".ppt", ".pptx", ".doc", ".docx", ".png", ".jpg", ".jpeg"];

export default function FileUploader({ onFilesChange }: FileUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync parent with done paths via useEffect to avoid setState-during-render
  useEffect(() => {
    const donePaths = files.filter((f) => f.status === "done").map((f) => f.storagePath);
    onFilesChange(donePaths);
  }, [files, onFilesChange]);

  const updateFiles = useCallback(
    (updater: (prev: UploadedFile[]) => UploadedFile[]) => {
      setFiles((prev) => updater(prev));
    },
    []
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const filename = file.name;

      // Add file to list as uploading
      const tempId = `${Date.now()}-${filename}`;
      updateFiles((prev) => [
        ...prev,
        { filename, storagePath: tempId, status: "uploading", progress: 0 },
      ]);

      try {
        // 1. Get signed upload URL
        const urlRes = await fetch("/api/study-help/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename }),
        });

        if (!urlRes.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { signedUrl, path, token } = await urlRes.json();

        // 2. Upload via XHR for progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 100);
              updateFiles((prev) =>
                prev.map((f) =>
                  f.storagePath === tempId ? { ...f, progress: pct } : f
                )
              );
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener("error", () => reject(new Error("Upload failed")));

          xhr.open("PUT", signedUrl);
          xhr.setRequestHeader("x-upsert", "true");
          if (token) {
            xhr.setRequestHeader("x-supabase-upload-token", token);
          }
          xhr.send(file);
        });

        // 3. Mark as done with real storage path
        updateFiles((prev) =>
          prev.map((f) =>
            f.storagePath === tempId
              ? { ...f, storagePath: path, status: "done" as const, progress: 100 }
              : f
          )
        );
      } catch (err) {
        updateFiles((prev) =>
          prev.map((f) =>
            f.storagePath === tempId
              ? {
                  ...f,
                  status: "error" as const,
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : f
          )
        );
      }
    },
    [updateFiles]
  );

  const handleFiles = useCallback(
    (fileList: FileList) => {
      for (const file of Array.from(fileList)) {
        // Validate type
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ACCEPTED_TYPES.includes(file.type) && !ACCEPTED_EXTENSIONS.includes(ext)) {
          updateFiles((prev) => [
            ...prev,
            {
              filename: file.name,
              storagePath: `err-${Date.now()}`,
              status: "error",
              progress: 0,
              error: "File must be PDF, PPT, PPTX, DOC, DOCX, PNG, or JPG",
            },
          ]);
          continue;
        }

        // Validate size
        if (file.size > MAX_FILE_SIZE) {
          updateFiles((prev) => [
            ...prev,
            {
              filename: file.name,
              storagePath: `err-${Date.now()}`,
              status: "error",
              progress: 0,
              error: "File must be under 10 MB",
            },
          ]);
          continue;
        }

        uploadFile(file);
      }
    },
    [uploadFile, updateFiles]
  );

  const removeFile = (storagePath: string) => {
    updateFiles((prev) => prev.filter((f) => f.storagePath !== storagePath));
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={[
          "cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors sm:p-6",
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50",
        ].join(" ")}
      >
        <svg
          className="mx-auto h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="mt-2 text-sm font-medium text-gray-700">
          Drop files here or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, DOCX, PPTX, PNG, or JPG — up to 10 MB each
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = ""; // Reset so same file can be re-uploaded
        }}
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file) => (
            <div
              key={file.storagePath}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              {/* File icon */}
              <span className="text-lg">
                {file.filename.endsWith(".pdf") ? "📄" : (file.filename.endsWith(".pptx") || file.filename.endsWith(".ppt")) ? "📊" : "🖼️"}
              </span>

              {/* File info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-700">
                  {file.filename}
                </p>
                {file.status === "uploading" && (
                  <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
                {file.status === "error" && (
                  <p className="mt-0.5 text-xs text-red-500">{file.error}</p>
                )}
              </div>

              {/* Status / Remove */}
              {file.status === "done" && (
                <span className="text-green-500">✓</span>
              )}
              {file.status !== "uploading" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.storagePath);
                  }}
                  className="rounded p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Remove"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
