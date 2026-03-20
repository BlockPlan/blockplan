"use client";

import { useEffect, useRef, useState, useTransition, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseIcsFile, type ParsedEvent } from "@/lib/ics/parser";
import {
  importCalendarEvents,
  type ImportEventPayload,
} from "../import-actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = "upload" | "preview" | "importing";

interface ImportCalendarDialogProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportCalendarDialog({
  onClose,
}: ImportCalendarDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);

  // Open dialog on mount
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    const handleClose = () => onClose();
    dialog?.addEventListener("close", handleClose);
    return () => dialog?.removeEventListener("close", handleClose);
  }, [onClose]);

  // Handle file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.endsWith(".ics") && !file.name.endsWith(".ical")) {
        setError("Please select a .ics or .ical file");
        return;
      }

      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result as string;
          if (!text || !text.includes("VCALENDAR")) {
            setError("This file does not appear to be a valid iCalendar file.");
            return;
          }

          // Parse events within a 6-month window centered on today
          const now = new Date();
          const rangeStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1,
          );
          const rangeEnd = new Date(
            now.getFullYear(),
            now.getMonth() + 5,
            0,
          );

          const events = parseIcsFile(text, rangeStart, rangeEnd);

          if (events.length === 0) {
            setError(
              "No events found in this file within the current semester range.",
            );
            return;
          }

          setParsedEvents(events);
          setSelectedIndices(new Set(events.map((_, i) => i)));
          setStep("preview");
        } catch {
          setError("Failed to parse the calendar file. Please check the format.");
        }
      };
      reader.onerror = () => setError("Failed to read the file.");
      reader.readAsText(file);
    },
    [],
  );

  // Toggle individual event selection
  const toggleEvent = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedIndices.size === parsedEvents.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedEvents.map((_, i) => i)));
    }
  };

  // Import selected events
  const handleImport = () => {
    const eventsToImport: ImportEventPayload[] = parsedEvents
      .filter((_, i) => selectedIndices.has(i))
      .map((evt) => ({
        summary: evt.summary,
        startTime: evt.startTime,
        endTime: evt.endTime,
        description: evt.description,
        location: evt.location,
      }));

    if (eventsToImport.length === 0) {
      setError("Please select at least one event to import.");
      return;
    }

    setStep("importing");
    startTransition(async () => {
      const result = await importCalendarEvents(eventsToImport);
      if (result.success) {
        toast.success(
          `Imported ${result.importedCount} event${result.importedCount === 1 ? "" : "s"} to your calendar`,
        );
        dialogRef.current?.close();
      } else {
        setError(result.error ?? "Import failed");
        setStep("preview");
      }
    });
  };

  // Format event time for display
  const formatEventTime = (iso: string) => {
    try {
      return format(new Date(iso), "MMM d, yyyy h:mm a");
    } catch {
      return iso;
    }
  };

  const formatShortTime = (iso: string) => {
    try {
      return format(new Date(iso), "h:mm a");
    } catch {
      return iso;
    }
  };

  // Group events by date for a nicer preview
  const groupedEvents = parsedEvents.reduce(
    (acc, evt, idx) => {
      const dateKey = format(new Date(evt.startTime), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push({ event: evt, index: idx });
      return acc;
    },
    {} as Record<string, { event: ParsedEvent; index: number }[]>,
  );

  const sortedDateKeys = Object.keys(groupedEvents).sort();

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-0 shadow-[var(--shadow-dialog)] ring-1 ring-gray-900/5 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Import Calendar
          </h3>
          <button
            onClick={() => dialogRef.current?.close()}
            className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg
              className="h-5 w-5"
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
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step: Upload */}
        {step === "upload" && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Upload an .ics file exported from Google Calendar, Outlook, Canvas,
              or any calendar app. Recurring events (like class schedules) will
              be expanded for the current semester.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center transition-colors hover:border-blue-400 hover:bg-blue-50"
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
              <p className="mt-3 text-sm font-medium text-gray-700">
                {fileName || "Click to select an .ics file"}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Supports .ics and .ical files
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".ics,.ical"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => dialogRef.current?.close()}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === "preview" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {parsedEvents.length}
                </span>{" "}
                event{parsedEvents.length === 1 ? "" : "s"} found
                {fileName && (
                  <span className="text-gray-400"> in {fileName}</span>
                )}
              </p>
              <button
                onClick={toggleAll}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                {selectedIndices.size === parsedEvents.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {/* Event list grouped by date */}
            <div className="max-h-80 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
              {sortedDateKeys.map((dateKey) => (
                <div key={dateKey}>
                  <div className="sticky top-0 z-10 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                    {format(new Date(dateKey + "T12:00:00"), "EEEE, MMM d, yyyy")}
                  </div>
                  {groupedEvents[dateKey].map(({ event, index }) => (
                    <label
                      key={index}
                      className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(index)}
                        onChange={() => toggleEvent(index)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.summary}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatShortTime(event.startTime)} &ndash;{" "}
                          {formatShortTime(event.endTime)}
                          <span className="mx-1.5 text-gray-300">|</span>
                          {event.durationMinutes} min
                          {event.isRecurring && (
                            <span className="ml-1.5 inline-flex items-center rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                              recurring
                            </span>
                          )}
                        </p>
                        {event.location && (
                          <p className="text-xs text-gray-400 truncate">
                            {event.location}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <p className="mt-2 text-xs text-gray-400">
              {selectedIndices.size} of {parsedEvents.length} selected. Imported
              events appear as &quot;[Imported]&quot; blocks on your calendar.
            </p>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => {
                  setStep("upload");
                  setParsedEvents([]);
                  setSelectedIndices(new Set());
                  setFileName("");
                  setError(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => dialogRef.current?.close()}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={isPending || selectedIndices.size === 0}
                  className="btn-primary disabled:opacity-60"
                >
                  Import {selectedIndices.size} Event
                  {selectedIndices.size === 1 ? "" : "s"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === "importing" && (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            <p className="mt-4 text-sm text-gray-600">
              Importing {selectedIndices.size} event
              {selectedIndices.size === 1 ? "" : "s"}...
            </p>
          </div>
        )}
      </div>
    </dialog>
  );
}
