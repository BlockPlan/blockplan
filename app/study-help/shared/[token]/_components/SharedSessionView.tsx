"use client";

import type { StudyHelp } from "@/lib/study-help/types";
import StudyHelpResults from "@/app/study-help/_components/StudyHelpResults";

export default function SharedSessionView({ data }: { data: StudyHelp }) {
  return <StudyHelpResults data={data} />;
}
