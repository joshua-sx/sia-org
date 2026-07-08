import { Target, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS, cardBase } from "./constants";
import { FadeBlock, IconTile } from "./primitives";

export function HeroBento() {
  return (
    <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 md:gap-5 md:auto-rows-[180px]">
      <FadeBlock custom={0} className={cn(cardBase, "md:col-span-4 md:row-span-2 overflow-hidden flex flex-col")}>
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-black/[0.06]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.yellow }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
          <span className="ml-3 text-xs text-black/40">SIA — Q3 Appraisal Cycle</span>
        </div>
        <div className="p-5 md:p-7 grid grid-cols-3 gap-5 flex-1">
          {[
            { label: "Completion", value: "87%", bar: 87, color: COLORS.blue },
            { label: "Submitted", value: "342", bar: 68, color: COLORS.green },
            { label: "Avg. Rating", value: "4.2", bar: 84, color: COLORS.yellow },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-black/40 font-medium">{s.label}</span>
              <span className="text-3xl font-bold tracking-tight tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {s.value}
              </span>
              <div className="w-full h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.bar}%`, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 md:px-7 pb-6 space-y-2">
          {[
            { name: "Engineering", pct: 92, color: COLORS.blue },
            { name: "Operations", pct: 78, color: COLORS.green },
            { name: "Customer Success", pct: 64, color: COLORS.yellow },
          ].map((r) => (
            <div key={r.name} className="flex items-center gap-4 text-xs">
              <span className="w-40 text-black/70 truncate">{r.name}</span>
              <div className="flex-1 h-1 bg-black/[0.05] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
              </div>
              <span className="tabular-nums text-black/50 w-8 text-right">{r.pct}%</span>
            </div>
          ))}
        </div>
      </FadeBlock>

      <FadeBlock custom={1} className={cn(cardBase, "md:col-span-2 p-5 flex flex-col justify-between")}>
        <IconTile icon={Target} color={COLORS.blue} />
        <div>
          <div className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            1,284
          </div>
          <div className="text-xs text-black/50 mt-1">Goals cascaded this quarter</div>
        </div>
      </FadeBlock>

      <FadeBlock custom={2} className={cn(cardBase, "md:col-span-2 p-5 flex flex-col gap-3")}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} style={{ color: COLORS.green }} />
          <span className="text-xs font-medium text-black/70">Review submitted</span>
        </div>
        <div className="text-sm text-black/60 leading-snug">
          <span className="font-medium text-black">Priya M.</span> completed her 360° review for Q3
        </div>
        <div className="flex gap-1.5 mt-auto">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS.green}1A`, color: COLORS.green }}>
            On time
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/[0.05] text-black/60">Manager</span>
        </div>
      </FadeBlock>
    </div>
  );
}
