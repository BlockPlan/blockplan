import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton, CardSkeleton } from "@/app/_components/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="page-bg">
      <NavHeader />

      <main className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="mb-8 h-8 w-32" />

        {/* Account section */}
        <CardSkeleton lines={3} />
        <div className="mb-6" />

        {/* Plan section */}
        <CardSkeleton lines={2} />
        <div className="mb-6" />

        {/* Preferences section */}
        <CardSkeleton lines={5} />
        <div className="mb-6" />

        {/* Quick links */}
        <CardSkeleton lines={2} />
      </main>
    </div>
  );
}
