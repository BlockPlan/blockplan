"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createManualSession } from "@/app/study-help/actions";
import SessionEditor from "@/app/study-help/_components/SessionEditor";

interface Course {
  id: string;
  name: string;
}

export default function CreateSessionClient({
  courses,
}: {
  courses: Course[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");

  return (
    <div>
      {/* Title & Course */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Chapter 5 Review Cards"
          />
        </div>

        {courses.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Course (optional)
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">No course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <SessionEditor
        sessionId={null}
        initialData={{ flashcards: [{ front: "", back: "" }], quiz: [] }}
        onSave={async (data) => {
          const sessionTitle =
            title.trim() ||
            `Study Cards — ${new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}`;

          const result = await createManualSession({
            title: sessionTitle,
            courseId: courseId || undefined,
            flashcards: data.flashcards,
            quiz: data.quiz,
          });

          if (result.error) return { error: result.error };

          // Redirect to the new session
          router.push(`/study-help/${result.sessionId}`);
          return {};
        }}
        onCancel={() => router.push("/study-help")}
      />
    </div>
  );
}
