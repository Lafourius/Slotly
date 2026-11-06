import { Skeleton } from "@/components/ui/skeleton";

export default function BookingLoading() {
  return (
    <div className="min-h-dvh bg-canvas" aria-busy="true" aria-label="Loading booking page">
      <div className="border-b border-line bg-surface">
        <div className="page-shell flex h-16 items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="page-shell max-w-[1080px] py-6 sm:py-8">
        <Skeleton className="h-[132px] rounded-card" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="space-y-4">
            <Skeleton className="h-[190px] rounded-card" />
            <Skeleton className="h-[280px] rounded-card" />
          </div>
          <Skeleton className="h-[300px] rounded-card" />
        </div>
      </div>
    </div>
  );
}
