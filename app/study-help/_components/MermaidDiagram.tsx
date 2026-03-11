"use client";

import { useEffect, useState } from "react";

/**
 * Sanitize Mermaid code to fix common AI-generated syntax issues.
 * Parentheses in node labels are the most frequent problem — Mermaid
 * interprets them as node shape syntax (e.g. `(label)` = rounded node).
 */
function sanitizeMermaidCode(code: string): string {
  const lines = code.split("\n");
  const isMindmap = lines[0]?.trim() === "mindmap";

  if (isMindmap) {
    // For mindmap: only the root node uses (( )), all other lines are plain text
    return lines
      .map((line, i) => {
        // Keep first line ("mindmap") and root node line as-is
        if (i === 0) return line;
        const trimmed = line.trimStart();
        if (trimmed.startsWith("root((") || trimmed.startsWith("root(")) return line;
        // Strip parentheses and their content or replace with dashes
        // "Go-To-Market (GTM) Strategy" → "Go-To-Market GTM Strategy"
        return line.replace(/[()]/g, "");
      })
      .join("\n");
  }

  // For flowchart/graph: parentheses inside [...] labels break parsing
  // Replace ( and ) inside bracket labels with dashes
  return code.replace(/\[([^\]]*)\]/g, (match, label: string) => {
    return "[" + label.replace(/[()]/g, "") + "]";
  });
}

export default function MermaidDiagram({
  code,
  id,
}: {
  code: string;
  id: string;
}) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        setLoading(true);
        setError(null);
        setSvgContent(null);

        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "strict",
        });

        if (cancelled) return;

        const sanitized = sanitizeMermaidCode(code);
        const { svg } = await mermaid.render(`mermaid-${id}`, sanitized);

        if (cancelled) return;
        setSvgContent(svg);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram"
          );
        }
        // Mermaid dumps error SVGs into document.body on parse failure — clean them up
        if (typeof document !== "undefined") {
          // Remove the specific render container Mermaid creates
          const errContainer = document.getElementById(`dmermaid-${id}`);
          if (errContainer) errContainer.remove();
          // Remove any orphaned Mermaid error SVGs appended to body
          document.querySelectorAll("body > [id^='d'] > svg").forEach((svg) => {
            if (svg.getAttribute("aria-roledescription") === "error") {
              svg.parentElement?.remove();
            }
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-8">
        <svg
          className="h-5 w-5 animate-spin text-gray-400"
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
        <span className="ml-2 text-sm text-gray-500">
          Rendering diagram...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-700">
          Diagram rendering error
        </p>
        <p className="mt-1 text-xs text-red-600">{error}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-red-500">
            Show raw code
          </summary>
          <pre className="mt-1 overflow-auto whitespace-pre-wrap break-words rounded bg-red-100 p-2 text-xs text-red-800">
            {code}
          </pre>
        </details>
      </div>
    );
  }

  if (!svgContent) return null;

  return (
    <div
      className="overflow-auto rounded-lg border border-gray-200 bg-white p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
