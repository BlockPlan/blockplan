import NavHeader from "@/app/plan/_components/NavHeader";
import { Skeleton, CardSkeleton } from "@/app/_components/LoadingSkeleton";

export default function SyllabiUploadLoading() {
  return (
    <div className="page-bg">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-44" />
        <CardSkeleton lines={5} />
      </main>
    </div>
  );
}
