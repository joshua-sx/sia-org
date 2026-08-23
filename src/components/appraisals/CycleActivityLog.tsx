import { useMemo, useState } from "react";
import { Download, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueryError, QueryLoading } from "@/components/QueryState";
import { useCycleAudit } from "@/hooks/useCycleAudit";
import {
  AUDIT_FILTERS,
  AUDIT_FILTER_LABELS,
  actionLabel,
  auditTone,
  exportAuditCsv,
  filterAuditEvents,
  formatAuditTime,
  type AuditFilter,
  type AuditTone,
} from "@/lib/auditLog";

const TONE_CHIP: Record<AuditTone, string> = {
  critical: "text-[hsl(var(--accent-red))] bg-[hsl(var(--accent-red)/0.1)]",
  milestone: "text-[hsl(var(--accent-green))] bg-[hsl(var(--accent-green)/0.1)]",
  neutral: "text-[hsl(var(--ink-subtle))] bg-[hsl(var(--hairline)/0.5)]",
};

const TONE_DOT: Record<AuditTone, string> = {
  critical: "bg-[hsl(var(--accent-red))]",
  milestone: "bg-[hsl(var(--accent-green))]",
  neutral: "bg-[hsl(var(--hairline))]",
};

const PAGE_SIZE = 25;

export function CycleActivityLog({
  cycleId,
  cycleName,
}: {
  cycleId: string;
  cycleName: string;
}) {
  const { data: events = [], isLoading, isError, error, refetch } = useCycleAudit(cycleId);
  const [filter, setFilter] = useState<AuditFilter>("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => filterAuditEvents(events, filter), [events, filter]);
  const shown = filtered.slice(0, visible);

  return (
    <section className="mt-6 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <History className="h-4 w-4 text-[hsl(var(--ink-muted))]" />
            Activity log
          </h2>
          <p className="mt-0.5 text-xs text-[hsl(var(--ink-muted))]">
            A permanent, uneditable record of every change to this cycle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(v) => { setFilter(v as AuditFilter); setVisible(PAGE_SIZE); }}>
            <SelectTrigger className="h-8 w-[168px] text-xs" aria-label="Filter activity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIT_FILTERS.map((f) => (
                <SelectItem key={f} value={f} className="text-xs">
                  {AUDIT_FILTER_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={filtered.length === 0}
            onClick={() => exportAuditCsv(cycleName, filtered)}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="border-t border-[hsl(var(--hairline))] px-5 py-6">
          <QueryLoading label="Loading activity" rows={3} />
        </div>
      )}

      {isError && (
        <div className="border-t border-[hsl(var(--hairline))] px-5 py-6">
          <QueryError
            message={error instanceof Error ? error.message : undefined}
            onRetry={() => void refetch()}
          />
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="border-t border-[hsl(var(--hairline))] px-5 py-8 text-center">
          <p className="text-sm text-[hsl(var(--ink-muted))]">
            {events.length === 0
              ? "Nothing has happened on this cycle yet."
              : "No activity matches this filter."}
          </p>
        </div>
      )}

      {!isLoading && !isError && shown.length > 0 && (
        <>
          <ol className="border-t border-[hsl(var(--hairline))]">
            {shown.map((e) => {
              const tone = auditTone(e);
              return (
                <li
                  key={e.id}
                  className="flex gap-3 border-b border-[hsl(var(--hairline))] px-5 py-3 last:border-b-0"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${TONE_DOT[tone]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${TONE_CHIP[tone]}`}
                      >
                        {actionLabel(e.action)}
                      </span>
                      <time
                        dateTime={e.created_at}
                        className="text-[11px] tabular-nums text-[hsl(var(--ink-subtle))]"
                      >
                        {formatAuditTime(e.created_at)}
                      </time>
                    </div>
                    {e.summary && (
                      <p className="mt-1 text-sm text-foreground break-words">{e.summary}</p>
                    )}
                    <p className="mt-0.5 text-xs text-[hsl(var(--ink-muted))]">
                      {e.actor_email ?? "System"}
                      {e.actor_role ? ` · ${e.actor_role.replace("_", " ")}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
          {visible < filtered.length && (
            <div className="px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
                <span className="ml-1 text-[hsl(var(--ink-subtle))]">
                  ({filtered.length - visible} remaining)
                </span>
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
