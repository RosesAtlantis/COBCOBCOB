import Link from "next/link";
import { Inbox } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="dashboard-surface">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
          <Inbox className="size-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {actionLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
