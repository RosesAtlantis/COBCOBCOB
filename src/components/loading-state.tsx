import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="dashboard-surface p-5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-4 h-8 w-36" />
            <Skeleton className="mt-5 h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="dashboard-surface p-5">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-6 h-72 w-full" />
      </div>
    </div>
  );
}
