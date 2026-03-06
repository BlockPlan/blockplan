import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton, CardSkeleton } from "@/app/_components/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* 3-column pricing card skeletons */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} lines={8} />
          ))}
        </div>
      </main>
    </div>
  );
}
