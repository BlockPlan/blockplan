import type { ParsedItem } from "@/lib/syllabus/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the fraction of words shared between two strings (case-insensitive).
 * Returns a value between 0 (no overlap) and 1 (identical word sets).
 */
function wordOverlap(a: string, b: string): number {
  const tokenize = (s: string) =>
    s
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 0);

  const wordsA = new Set(tokenize(a));
  const wordsB = new Set(tokenize(b));

  if (wordsA.size === 0 && wordsB.size === 0) return 1;
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let shared = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) shared++;
  }

  return shared / Math.max(wordsA.size, wordsB.size);
}

/**
 * Return true if two dates (ISO strings or null) are within 1 calendar day
 * of each other. Two null dates are NOT considered equal — we can't tell.
 */
function datesWithinOneDay(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const msPerDay = 86_400_000;
  const diff = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return diff <= msPerDay;
}

/**
 * Return true when two parsed items are considered duplicates:
 *  - Same type
 *  - Due dates within 1 day of each other
 *  - Titles share > 60% of words
 */
function areDuplicates(a: ParsedItem, b: ParsedItem): boolean {
  return (
    a.type === b.type &&
    datesWithinOneDay(a.dueDate, b.dueDate) &&
    wordOverlap(a.title, b.title) > 0.6
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Merge rule-based and LLM parser results, deduplicating overlapping items.
 *
 * When duplicates are detected, the LLM version is kept (assumed higher
 * confidence). Results are sorted by dueDate ascending with nulls last.
 *
 * @param ruleItems - Items produced by the rule-based parser
 * @param llmItems  - Items produced by the LLM parser
 * @returns Combined, deduplicated, sorted array of ParsedItems with source='merged'
 */
export function mergeParserResults(
  ruleItems: ParsedItem[],
  llmItems: ParsedItem[]
): ParsedItem[] {
  // Fast paths
  if (ruleItems.length === 0) return llmItems;
  if (llmItems.length === 0) return ruleItems;

  // Track which rule-based items were superseded by an LLM item
  const supersededRuleIndexes = new Set<number>();

  for (const llmItem of llmItems) {
    for (let i = 0; i < ruleItems.length; i++) {
      if (areDuplicates(ruleItems[i], llmItem)) {
        supersededRuleIndexes.add(i);
      }
    }
  }

  const survivingRuleItems = ruleItems.filter(
    (_, i) => !supersededRuleIndexes.has(i)
  );

  const combined: ParsedItem[] = [...survivingRuleItems, ...llmItems];

  // Sort by dueDate ascending; items without a date go to the end
  combined.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return combined;
}
