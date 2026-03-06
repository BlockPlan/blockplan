import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton } from "@/app/_components/LoadingSkeleton";

export default function PlanLoading() {
  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Title + action buttons */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="ml-2 h-5 w-40" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="min-w-0">
              <Skeleton className="mb-2 h-12 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-16 rounded-lg" />
                {i % 2 === 0 && <Skeleton className="h-16 rounded-lg" />}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
