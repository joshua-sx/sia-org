import { formatScore } from "@/lib/scoring";

interface ScoreStatProps {
  label: string;
  value: number | null;
  emphasize?: boolean;
}

export function ScoreStat({ label, value, emphasize = false }: ScoreStatProps) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-ink-subtle">{label}</p>
      <p
        className={`tabular-nums font-semibold ${emphasize ? "text-lg text-accent-green" : "text-sm text-foreground"}`}
      >
        {formatScore(value)}
      </p>
    </div>
  );
}
