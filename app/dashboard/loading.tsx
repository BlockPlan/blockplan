import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton, CardSkeleton, ListSkeleton } from "@/app/_components/LoadingSkeleton";

export default function DashboardLoading() {
  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-48" />

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>

        {/* Priority tasks */}
        <Skeleton className="mb-3 h-5 w-32" />
        <ListSkeleton rows={4} />

        {/* Quick notes */}
        <div className="mt-6">
          <Skeleton className="mb-3 h-5 w-28" />
          <CardSkeleton lines={4} />
        </div>
      </main>
    </div>
  );
}
