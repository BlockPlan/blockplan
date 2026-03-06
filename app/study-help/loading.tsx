import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton, ListSkeleton } from "@/app/_components/LoadingSkeleton";

export default function StudyHelpLoading() {
  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>

        <ListSkeleton rows={4} />
      </main>
    </div>
  );
}
