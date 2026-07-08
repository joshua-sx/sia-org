import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface QueryLoadingProps {
  className?: string;
  /** Accessible name for the loading region (defaults to "Loading content"). */
  label?: string;
  rows?: number;
}

export function QueryLoading({ className, label = "Loading content", rows = 3 }: QueryLoadingProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  );
}

interface QueryErrorProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export function QueryError({ message, onRetry, className }: QueryErrorProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-6 py-8 text-center",
        className,
      )}
      role="alert"
    >
      <p className="text-sm font-medium text-foreground">Couldn&apos;t load this data</p>
      <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
        {message ?? "Something went wrong. Check your connection and try again."}
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
