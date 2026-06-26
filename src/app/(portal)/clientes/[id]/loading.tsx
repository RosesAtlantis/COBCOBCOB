import { Skeleton } from "@/components/ui/skeleton";

function SummarySkeleton() {
  return (
    <div className="dashboard-surface p-4">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="mt-4 h-8 w-32" />
      <Skeleton className="mt-3 h-3 w-24" />
    </div>
  );
}

export default function ClienteDetailLoading() {
  return (
    <div className="space-y-6">
      <section className="dashboard-surface p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-6 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-11 w-40 rounded-lg" />
        </div>
      </section>

      <section className="dashboard-grid md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SummarySkeleton key={index} />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-28 rounded-xl" />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="dashboard-surface p-5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>

          <div className="dashboard-surface p-5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-72" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
