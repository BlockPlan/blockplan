import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton, CardSkeleton } from "@/app/_components/LoadingSkeleton";

export default function CoursesLoading() {
  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        <div className="space-y-4">
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
          <CardSkeleton lines={2} />
        </div>
      </main>
    </div>
  );
}
