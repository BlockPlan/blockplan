"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StudyHelp } from "@/lib/study-help/types";
import { updateStudyHelpData } from "@/app/study-help/actions";
import StudyHelpResults from "@/app/study-help/_components/StudyHelpResults";
import SessionEditor from "@/app/study-help/_components/SessionEditor";

interface SessionDetailClientProps {
  sessionId: string;
  data: StudyHelp;
  courseName?: string;
}

export default function SessionDetailClient({
  sessionId,
  data,
  courseName,
}: SessionDetailClientProps) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

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
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Edit Flashcards &amp; Quiz
        </button>
      </div>
      <StudyHelpResults data={data} courseName={courseName} />
    </div>
  );
}
