"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AvailabilityRule } from "@/lib/validations/availability";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// 6:00 AM to 11:00 PM in 30-minute increments = 34 slots
const START_HOUR = 6;
const END_HOUR = 23; // exclusive — last slot ends at 23:00
const SLOT_COUNT = (END_HOUR - START_HOUR) * 2; // 34 slots

function slotToTime(slot: number): string {
  const totalMinutes = START_HOUR * 60 + slot * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function slotLabel(slot: number): string {
  const totalMinutes = START_HOUR * 60 + slot * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${displayH} ${ampm}` : `${displayH}:${String(m).padStart(2, "0")}`;
}

type CellKey = `${number}-${number}`; // `${day}-${slot}`

type RuleType = "available" | "blocked" | "preferred";

type CellState = {
  type: RuleType;
  label?: string;
};

// Merge consecutive same-type cells in the same day into ranges
function cellsToRules(cells: Map<CellKey, CellState>): AvailabilityRule[] {
  const rules: AvailabilityRule[] = [];

  for (let day = 0; day < 7; day++) {
    // Collect all filled slots for this day
    const filled: Array<{ slot: number; state: CellState }> = [];
    for (let slot = 0; slot < SLOT_COUNT; slot++) {
      const state = cells.get(`${day}-${slot}`);
      if (state) {
        filled.push({ slot, state });
      }
    }

    if (filled.length === 0) continue;

    // Group consecutive slots of the same type+label into runs
    let i = 0;
    while (i < filled.length) {
      const current = filled[i];
      let j = i + 1;
      while (
        j < filled.length &&
        filled[j].slot === filled[j - 1].slot + 1 &&
        filled[j].state.type === current.state.type &&
        filled[j].state.label === current.state.label
      ) {
        j++;
      }
      // Run from filled[i] to filled[j-1]
      const startSlot = filled[i].slot;
      const endSlot = filled[j - 1].slot;
      rules.push({
        day_of_week: day,
        start_time: slotToTime(startSlot),
        end_time: slotToTime(endSlot + 1), // exclusive end
        rule_type: current.state.type,
        label: current.state.type === "blocked" ? current.state.label : undefined,
      });
      i = j;
    }
  }

  return rules;
}

// Convert existing rules back into a cell map (for pre-filling)
function rulesToCells(rules: AvailabilityRule[]): Map<CellKey, CellState> {
  const cells = new Map<CellKey, CellState>();
  for (const rule of rules) {
    // Convert time strings to slot indices
    const [startH, startM] = rule.start_time.split(":").map(Number);
    const [endH, endM] = rule.end_time.split(":").map(Number);
    const startSlot = (startH - START_HOUR) * 2 + startM / 30;
    const endSlot = (endH - START_HOUR) * 2 + endM / 30;

    for (let slot = startSlot; slot < endSlot; slot++) {
      if (slot >= 0 && slot < SLOT_COUNT) {
        cells.set(`${rule.day_of_week}-${slot}`, {
          type: rule.rule_type,
          label: rule.label,
        });
      }
    }
  }
  return cells;
}

// ─── Component ───────────────────────────────────────────────────────────────

type AvailabilityGridProps = {
  initialRules?: AvailabilityRule[];
  onChange: (rules: AvailabilityRule[]) => void;
};

export default function AvailabilityGrid({
  initialRules = [],
  onChange,
}: AvailabilityGridProps) {
  const [cells, setCells] = useState<Map<CellKey, CellState>>(() =>
    rulesToCells(initialRules)
  );
  const [paintMode, setPaintMode] = useState<RuleType>("available");
  const [blockedLabel, setBlockedLabel] = useState("Work");
  const [customLabel, setCustomLabel] = useState("");
  const isDragging = useRef(false);
  const dragMode = useRef<"paint" | "clear">("paint");

  const effectiveLabel =
    paintMode === "blocked"
      ? blockedLabel === "Custom"
        ? customLabel
        : blockedLabel
      : undefined;

  // Notify parent whenever cells change
  useEffect(() => {
    onChange(cellsToRules(cells));
  }, [cells, onChange]);

  const toggleCell = useCallback(
    (day: number, slot: number) => {
      setCells((prev) => {
        const next = new Map(prev);
        const key: CellKey = `${day}-${slot}`;
        if (dragMode.current === "clear") {
          next.delete(key);
        } else {
          next.set(key, {
            type: paintMode,
            label: effectiveLabel,
          });
        }
        return next;
      });
    },
    [paintMode, effectiveLabel]
  );

  function handleCellMouseDown(day: number, slot: number) {
    const key: CellKey = `${day}-${slot}`;
    const existing = cells.get(key);
    // If cell is already painted with the same type, dragging clears it
    dragMode.current =
      existing && existing.type === paintMode && existing.label === effectiveLabel
        ? "clear"
        : "paint";
    isDragging.current = true;
    toggleCell(day, slot);
  }

  function handleCellMouseEnter(day: number, slot: number) {
    if (isDragging.current) {
      toggleCell(day, slot);
    }
  }

  function handleMouseUp() {
    isDragging.current = false;
  }

  function clearAll() {
    setCells(new Map());
  }

  const BLOCKED_LABELS = ["Work", "Church", "Class", "Devotional", "Other", "Custom"];

  return (
    <div onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Controls row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Paint mode buttons */}
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {(
            [
              { mode: "available", label: "Available", color: "bg-green-500" },
              { mode: "blocked", label: "Blocked", color: "bg-red-500" },
              { mode: "preferred", label: "Preferred", color: "bg-blue-500" },
            ] as { mode: RuleType; label: string; color: string }[]
          ).map(({ mode, label, color }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPaintMode(mode)}
              className={[
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                paintMode === mode
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50",
              ].join(" ")}
            >
              <span
                className={`inline-block h-2.5 w-2.5 rounded-sm ${color}`}
              />
              {label}
            </button>
          ))}
        </div>

        {/* Blocked label selector — only visible when paintMode === "blocked" */}
        {paintMode === "blocked" && (
          <div className="flex items-center gap-2">
            <select
              value={blockedLabel}
              onChange={(e) => setBlockedLabel(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BLOCKED_LABELS.map((lbl) => (
                <option key={lbl} value={lbl}>
                  {lbl}
                </option>
              ))}
            </select>
            {blockedLabel === "Custom" && (
              <input
                type="text"
                placeholder="Label…"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-28 rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        )}

        {/* Clear button */}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-green-400" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-400" />
          Blocked
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-400" />
          Preferred
        </span>
      </div>

      {/* Grid */}
      <div
        className="overflow-x-auto select-none"
        style={{ userSelect: "none" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `56px repeat(7, 1fr)`,
            minWidth: "480px",
          }}
        >
          {/* Header row */}
          <div className="text-xs text-gray-400 pb-1" />
          {DAYS.map((day, d) => (
            <div
              key={day}
              className="pb-1 text-center text-xs font-semibold text-gray-600"
              aria-label={DAY_FULL[d]}
            >
              {day}
            </div>
          ))}

          {/* Time rows */}
          {Array.from({ length: SLOT_COUNT }, (_, slot) => {
            const showLabel = slot % 2 === 0; // show label on the hour
            return (
              <React.Fragment key={`row-${slot}`}>
                {/* Time label */}
                <div
                  className="pr-1 text-right text-xs text-gray-400 leading-none"
                  style={{ height: "20px", lineHeight: "20px" }}
                >
                  {showLabel ? slotLabel(slot) : ""}
                </div>

                {/* Day cells */}
                {Array.from({ length: 7 }, (_, day) => {
                  const key: CellKey = `${day}-${slot}`;
                  const state = cells.get(key);
                  const cellColor = state
                    ? state.type === "available"
                      ? "bg-green-400 border-green-500"
                      : state.type === "blocked"
                        ? "bg-red-400 border-red-500"
                        : "bg-blue-400 border-blue-500"
                    : "bg-white border-gray-100 hover:bg-gray-50";

                  return (
                    <div
                      key={`${day}-${slot}`}
                      onMouseDown={() => handleCellMouseDown(day, slot)}
                      onMouseEnter={() => handleCellMouseEnter(day, slot)}
                      title={
                        state
                          ? `${DAY_FULL[day]} ${slotToTime(slot)} — ${state.type}${state.label ? ` (${state.label})` : ""}`
                          : `${DAY_FULL[day]} ${slotToTime(slot)}`
                      }
                      className={[
                        "border cursor-pointer transition-colors",
                        cellColor,
                      ].join(" ")}
                      style={{ height: "20px" }}
                      aria-label={
                        state
                          ? `${DAY_FULL[day]} ${slotToTime(slot)} ${state.type}${state.label ? ` ${state.label}` : ""}`
                          : `${DAY_FULL[day]} ${slotToTime(slot)} empty`
                      }
                    />
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Click or drag to paint cells. Click a painted cell again to clear it.
      </p>
    </div>
  );
}
