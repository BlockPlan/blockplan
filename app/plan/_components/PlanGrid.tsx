"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { generatePlan } from "../actions";
import PlanBlock from "./PlanBlock";
import RiskBadge from "./RiskBadge";

interface RiskTask {
  taskId: string;
  taskTitle: string;
  level: "at_risk" | "overdue_risk";
}

interface PlanBlockRow {
  id: string;
  start_time: string;
  end_time: string;
  status: "scheduled" | "done" | "missed";
  tasks: {
    title: string;
    courses: {
      name: string;
    } | null;
  } | null;
}

interface PlanGridProps {
  blocks: PlanBlockRow[];
  riskTasks: RiskTask[];
  hasAvailability: boolean;
}

function getDayLabel(isoString: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(isoString));
}

function getDateKey(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function buildDayColumns(blocks: PlanBlockRow[]): Array<{ key: string; label: string; blocks: PlanBlockRow[] }> {
  // Build 7 columns starting from today
  const today = new Date();
  const columns: Array<{ key: string; label: string; blocks: PlanBlockRow[] }> = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const label = new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
    columns.push({ key, label, blocks: [] });
  }

  // Assign blocks to their day column
  for (const block of blocks) {
    const key = getDateKey(block.start_time);
    const col = columns.find((c) => c.key === key);
    if (col) {
      col.blocks.push(block);
    }
  }

  // Sort blocks within each day by start_time
  for (const col of columns) {
    col.blocks.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }

  return columns;
}

export default function PlanGrid({
  blocks,
  riskTasks,
  hasAvailability,
}: PlanGridProps) {
  const [isPending, startTransition] = useTransition();

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generatePlan();
      if (result.success) {
        if (result.blocksScheduled && result.blocksScheduled > 0) {
          toast(`${result.blocksScheduled} blocks scheduled`);
        } else {
          toast("No blocks could be scheduled");
        }
      } else {
        toast("Failed to generate plan");
      }
    });
  };

  const dayColumns = buildDayColumns(blocks);

  return (
    <div>
      {/* Header row: title + generate button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Your Plan</h2>
        <button
          onClick={handleGenerate}
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "Generating..." : "Generate Plan"}
        </button>
      </div>

      {/* No availability warning */}
      {!hasAvailability && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Add availability windows in Settings before generating a plan.{" "}
          <Link
            href="/onboarding"
            className="font-medium underline hover:text-amber-900"
          >
            Set availability
          </Link>
        </div>
      )}

      {/* 7-day grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
        {dayColumns.map((col) => (
          <div key={col.key} className="min-w-0">
            {/* Day header */}
            <div className="mb-2 rounded-md bg-gray-100 px-2 py-1 text-center">
              <p className="text-xs font-semibold text-gray-700">{col.label}</p>
            </div>
            {/* Blocks or placeholder */}
            <div className="flex flex-col gap-1.5">
              {col.blocks.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-gray-400">
                  No blocks
                </p>
              ) : (
                col.blocks.map((block) => (
                  <PlanBlock key={block.id} block={block} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Risk badges */}
      {riskTasks.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium text-gray-500">
            Risk warnings
          </p>
          <div className="flex flex-wrap gap-2">
            {riskTasks.map((rt) => (
              <RiskBadge
                key={rt.taskId}
                level={rt.level}
                taskTitle={rt.taskTitle}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
