"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StudyHelp } from "@/lib/study-help/types";
import {
  updateStudyHelpData,
  shareStudyHelpSession,
  unshareStudyHelpSession,
} from "@/app/study-help/actions";
import StudyHelpResults from "@/app/study-help/_components/StudyHelpResults";
import SessionEditor from "@/app/study-help/_components/SessionEditor";

interface SessionDetailClientProps {
  sessionId: string;
  data: StudyHelp;
  courseName?: string;
  shareToken: string | null;
}

export default function SessionDetailClient({
  sessionId,
  data,
  courseName,
  shareToken: initialShareToken,
}: SessionDetailClientProps) {
  const [editing, setEditing] = useState(false);
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleShare = () => {
    if (shareToken) {
      setShowSharePanel(true);
      setCopied(false);
      return;
    }
    startTransition(async () => {
      const result = await shareStudyHelpSession(sessionId);
      if (result.shareToken) {
        setShareToken(result.shareToken);
        setShowSharePanel(true);
        setCopied(false);
      }
    });
  };

  const handleUnshare = () => {
    startTransition(async () => {
      await unshareStudyHelpSession(sessionId);
      setShareToken(null);
      setShowSharePanel(false);
    });
  };

  const copyLink = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/study-help/shared/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (editing) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Edit Flashcards &amp; Quiz
        </h2>
        <SessionEditor
          sessionId={sessionId}
          initialData={{
            flashcards: data.flashcards,
            quiz: data.quiz,
          }}
          onSave={async (updates) => {
            const result = await updateStudyHelpData(sessionId, updates);
            if (result.error) return { error: result.error };
            setEditing(false);
            router.refresh();
            return {};
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <button
          onClick={handleShare}
          disabled={isPending}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
            shareToken
              ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {isPending ? "Sharing..." : shareToken ? "Shared" : "Share"}
        </button>
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Edit Flashcards &amp; Quiz
        </button>
      </div>

      {/* Share panel */}
      {showSharePanel && shareToken && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={`${typeof window !== "undefined" ? window.location.origin : ""}/study-help/shared/${shareToken}`}
              className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={copyLink}
              className="flex-shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-emerald-700">
              Anyone with this link can view this study set
            </span>
            <button
              onClick={handleUnshare}
              disabled={isPending}
              className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Stop sharing
            </button>
          </div>
        </div>
      )}

      <StudyHelpResults data={data} courseName={courseName} />
    </div>
  );
}
