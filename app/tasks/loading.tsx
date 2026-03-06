import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton, ListSkeleton } from "@/app/_components/LoadingSkeleton";

export default function TasksLoading() {
  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>

        <ListSkeleton rows={6} />
      </main>
    </div>
  );
}
