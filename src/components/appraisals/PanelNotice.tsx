import { AlertTriangle } from "lucide-react";

export function PanelNotice({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-2.5 px-5 py-3 border-b border-[hsl(var(--hairline))]"
      style={{ backgroundColor: "hsl(var(--accent-yellow) / 0.08)" }}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "hsl(var(--accent-yellow))" }} />
      <p className="text-xs text-[hsl(var(--ink-muted))] leading-relaxed">{text}</p>
    </div>
  );
}
