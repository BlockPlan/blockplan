import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton, CardSkeleton } from "@/app/_components/LoadingSkeleton";

export default function SettingsLoading() {
  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-28" />

        <div className="space-y-6">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
          <CardSkeleton lines={2} />
        </div>
      </main>
    </div>
  );
}
