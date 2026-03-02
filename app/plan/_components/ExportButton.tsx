"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plan/export");
      if (!res.ok) {
        toast.error("Failed to export plan");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "blockplan.ics";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Plan exported to blockplan.ics");
    } catch {
      toast.error("Failed to export plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
    >
      {loading ? "Exporting..." : "Export to Calendar"}
    </button>
  );
}
