"use client";

import { useState } from "react";
import type { StudyHelp } from "@/lib/study-help/types";

interface ExportPdfModalProps {
  data: StudyHelp;
  title: string;
  courseName?: string;
  onClose: () => void;
}

const SECTIONS = [
  { key: "summary", label: "Summary", icon: "📝" },
  { key: "keyTerms", label: "Key Terms", icon: "📖" },
  { key: "flashcards", label: "Flashcards", icon: "🗂️" },
  { key: "quiz", label: "Quiz (with answers)", icon: "✅" },
  { key: "practiceTest", label: "Practice Test (with answers)", icon: "📝" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export default function ExportPdfModal({
  data,
  title,
  courseName,
  onClose,
}: ExportPdfModalProps) {
  const [selected, setSelected] = useState<Set<SectionKey>>(
    new Set(SECTIONS.map((s) => s.key))
  );
  const [generating, setGenerating] = useState(false);

  function toggleSection(key: SectionKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleExport() {
    if (selected.size === 0) return;
    setGenerating(true);

    try {
      // Dynamic import to keep bundle small
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // ── Helpers ─────────────────────────────────────────────────
      function checkPageBreak(needed: number) {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      }

      function addTitle(text: string) {
        checkPageBreak(40);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text(text, margin, y);
        y += 28;
      }

      function addSubtitle(text: string) {
        checkPageBreak(20);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(text, margin, y);
        doc.setTextColor(0, 0, 0);
        y += 18;
      }

      function addSectionHeader(text: string) {
        checkPageBreak(40);
        y += 10;
        doc.setFontSize(15);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text(text, margin, y);
        doc.setTextColor(0, 0, 0);
        y += 8;
        // Underline
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(1);
        doc.line(margin, y, margin + contentWidth, y);
        doc.setDrawColor(0, 0, 0);
        y += 16;
      }

      function addBody(text: string) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          checkPageBreak(16);
          doc.text(line, margin, y);
          y += 15;
        }
      }

      function addBoldBody(label: string, text: string) {
        doc.setFontSize(11);
        const labelWidth = doc.getTextWidth(label);
        doc.setFont("helvetica", "bold");

        // Check if the combined text fits on one line
        const remaining = contentWidth - labelWidth;
        const textLines = doc.splitTextToSize(text, remaining > 100 ? remaining : contentWidth);

        if (remaining > 100 && textLines.length === 1) {
          checkPageBreak(16);
          doc.text(label, margin, y);
          doc.setFont("helvetica", "normal");
          doc.text(textLines[0], margin + labelWidth, y);
          y += 15;
        } else {
          checkPageBreak(16);
          doc.text(label, margin, y);
          y += 15;
          doc.setFont("helvetica", "normal");
          for (const line of doc.splitTextToSize(text, contentWidth)) {
            checkPageBreak(16);
            doc.text(line, margin + 12, y);
            y += 15;
          }
        }
      }

      // ── Header ──────────────────────────────────────────────────
      addTitle(title);
      if (courseName) {
        addSubtitle(`Course: ${courseName}`);
      }
      addSubtitle(
        `Exported: ${new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}`
      );
      y += 8;

      // ── Summary ─────────────────────────────────────────────────
      if (selected.has("summary") && data.summary.length > 0) {
        addSectionHeader("Summary");
        data.summary.forEach((point, i) => {
          checkPageBreak(20);
          doc.setFontSize(11);
          doc.setFont("helvetica", "normal");
          const bullet = `${i + 1}. `;
          const bulletWidth = doc.getTextWidth(bullet);
          doc.text(bullet, margin, y);
          const lines = doc.splitTextToSize(point, contentWidth - bulletWidth);
          for (let j = 0; j < lines.length; j++) {
            if (j > 0) {
              checkPageBreak(16);
            }
            doc.text(lines[j], margin + bulletWidth, y);
            y += 15;
          }
          y += 3;
        });
      }

      // ── Key Terms ───────────────────────────────────────────────
      if (selected.has("keyTerms") && data.keyTerms.length > 0) {
        addSectionHeader("Key Terms");
        for (const item of data.keyTerms) {
          addBoldBody(`${item.term}: `, item.definition);
          y += 4;
        }
      }

      // ── Flashcards ──────────────────────────────────────────────
      if (selected.has("flashcards") && data.flashcards.length > 0) {
        addSectionHeader("Flashcards");
        data.flashcards.forEach((card, i) => {
          checkPageBreak(50);
          // Card number
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(120, 120, 120);
          doc.text(`Card ${i + 1}`, margin, y);
          doc.setTextColor(0, 0, 0);
          y += 16;

          addBoldBody("Q: ", card.front);
          addBoldBody("A: ", card.back);
          y += 6;

          // Separator line
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.5);
          doc.line(margin, y, margin + contentWidth, y);
          doc.setDrawColor(0, 0, 0);
          y += 10;
        });
      }

      // ── Quiz ────────────────────────────────────────────────────
      if (selected.has("quiz") && data.quiz.length > 0) {
        addSectionHeader("Multiple Choice Quiz");
        const optionLabels = ["A", "B", "C", "D"];
        data.quiz.forEach((q, i) => {
          checkPageBreak(80);
          // Question number and text
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          const qNum = `${i + 1}. `;
          const qNumWidth = doc.getTextWidth(qNum);
          doc.text(qNum, margin, y);
          doc.setFont("helvetica", "normal");
          const qLines = doc.splitTextToSize(q.question, contentWidth - qNumWidth);
          for (let j = 0; j < qLines.length; j++) {
            if (j > 0) checkPageBreak(16);
            doc.text(qLines[j], margin + qNumWidth, y);
            y += 15;
          }
          y += 4;

          // Options
          q.options.forEach((opt, oi) => {
            checkPageBreak(16);
            const isCorrect = oi === q.correctIndex;
            const prefix = `  ${optionLabels[oi]}) `;
            doc.setFont("helvetica", isCorrect ? "bold" : "normal");
            if (isCorrect) doc.setTextColor(22, 163, 74); // green-600
            const optLines = doc.splitTextToSize(
              `${prefix}${opt}${isCorrect ? " ✓" : ""}`,
              contentWidth - 12
            );
            for (const line of optLines) {
              checkPageBreak(16);
              doc.text(line, margin + 12, y);
              y += 15;
            }
            if (isCorrect) doc.setTextColor(0, 0, 0);
          });

          // Explanation
          y += 4;
          checkPageBreak(20);
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(100, 100, 100);
          const expLines = doc.splitTextToSize(
            `Explanation: ${q.explanation}`,
            contentWidth - 12
          );
          for (const line of expLines) {
            checkPageBreak(14);
            doc.text(line, margin + 12, y);
            y += 14;
          }
          doc.setTextColor(0, 0, 0);
          y += 8;

          // Separator
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.5);
          doc.line(margin, y, margin + contentWidth, y);
          doc.setDrawColor(0, 0, 0);
          y += 10;
        });
      }

      // ── Practice Test ───────────────────────────────────────────
      if (selected.has("practiceTest") && data.practiceTest.length > 0) {
        addSectionHeader("Practice Test");
        data.practiceTest.forEach((q, i) => {
          checkPageBreak(60);
          // Question
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          const qNum = `${i + 1}. `;
          const qNumWidth = doc.getTextWidth(qNum);
          doc.text(qNum, margin, y);
          doc.setFont("helvetica", "normal");
          const qLines = doc.splitTextToSize(q.question, contentWidth - qNumWidth);
          for (let j = 0; j < qLines.length; j++) {
            if (j > 0) checkPageBreak(16);
            doc.text(qLines[j], margin + qNumWidth, y);
            y += 15;
          }

          // Type badge
          y += 4;
          checkPageBreak(16);
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(120, 120, 120);
          doc.text(`[${q.type.toUpperCase()}]`, margin + 12, y);
          doc.setTextColor(0, 0, 0);
          y += 16;

          // Suggested answer
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(100, 100, 100);
          const aLines = doc.splitTextToSize(
            `Suggested answer: ${q.suggestedAnswer}`,
            contentWidth - 12
          );
          for (const line of aLines) {
            checkPageBreak(14);
            doc.text(line, margin + 12, y);
            y += 14;
          }
          doc.setTextColor(0, 0, 0);
          y += 8;

          // Separator
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.5);
          doc.line(margin, y, margin + contentWidth, y);
          doc.setDrawColor(0, 0, 0);
          y += 10;
        });
      }

      // ── Footer ──────────────────────────────────────────────────
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(160, 160, 160);
        doc.text(
          `Page ${p} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 30,
          { align: "center" }
        );
        doc.text("BlockPlan Study Materials", margin, pageHeight - 30);
      }

      // Save
      const filename = title
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
      doc.save(`${filename}.pdf`);
    } catch (err) {
      console.error("[export-pdf]", err);
    } finally {
      setGenerating(false);
      onClose();
    }
  }

  const hasAny = selected.size > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">
          Export to PDF
        </h3>
        <p className="mb-5 text-sm text-gray-500">
          Choose which sections to include in the PDF.
        </p>

        {/* Section checkboxes */}
        <div className="mb-6 space-y-3">
          {SECTIONS.map(({ key, label, icon }) => {
            // Skip sections with no data
            const sectionData = data[key];
            if (!sectionData || (Array.isArray(sectionData) && sectionData.length === 0)) {
              return null;
            }

            return (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 transition-colors hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(key)}
                  onChange={() => toggleSection(key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-base">{icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {label}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {Array.isArray(sectionData) ? sectionData.length : 0} items
                </span>
              </label>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!hasAny || generating}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Generating...
              </>
            ) : (
              <>📄 Download PDF</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
