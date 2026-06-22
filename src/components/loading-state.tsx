import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-border/80 bg-card/70 p-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-36" />
            <Skeleton className="mt-6 h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-border/80 bg-card/70 p-5">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-6 h-72 w-full" />
      </div>
    </div>
  );
}
