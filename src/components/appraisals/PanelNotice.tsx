import { AlertTriangle } from "lucide-react";

export function PanelNotice({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-hairline bg-accent-yellow/[0.08] px-5 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-accent-yellow" />
      <p className="text-xs text-ink-muted leading-relaxed">{text}</p>
    </div>
  );
}
