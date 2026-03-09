"use client";

import { useEffect, useRef, useState } from "react";

export default function MermaidDiagram({
  code,
  id,
}: {
  code: string;
  id: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        setLoading(true);
        setError(null);

        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "strict",
        });

        if (cancelled) return;

        const { svg } = await mermaid.render(`mermaid-${id}`, code);

        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to render diagram"
          );
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
      <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8">
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
          <pre className="mt-1 overflow-auto rounded bg-red-100 p-2 text-xs text-red-800">
            {code}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto rounded-lg border border-gray-200 bg-white p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
    />
  );
}
