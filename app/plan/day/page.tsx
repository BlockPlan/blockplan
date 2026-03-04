import { redirect } from "next/navigation";
import { format } from "date-fns";

// Redirect /plan/day to the unified calendar view in day mode
export default function DayPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  redirect(`/plan?view=day&date=${today}`);
}
