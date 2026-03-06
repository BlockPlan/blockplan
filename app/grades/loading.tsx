import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton, CardSkeleton, ListSkeleton } from "@/app/_components/LoadingSkeleton";

export default function GradesLoading() {
  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-28" />

        {/* GPA card */}
        <CardSkeleton lines={2} />

        {/* Course grades */}
        <div className="mt-6">
          <Skeleton className="mb-3 h-5 w-36" />
          <ListSkeleton rows={4} />
        </div>
      </main>
    </div>
  );
}
