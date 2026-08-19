import { motion } from "framer-motion";
import { Check, FileSpreadsheet, Mail, Users } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";
import { COLORS, GROTESK } from "./constants";

const ease = [0.22, 1, 0.36, 1] as const;

function SourceCard({
  icon: Icon,
  label,
  detail,
  className,
  delay,
}: {
  icon: typeof FileSpreadsheet;
  label: string;
  detail: string;
  className: string;
  delay: number;
}) {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay, ease }}
      className={`absolute hidden items-center gap-3 rounded-2xl bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_18px_50px_-24px_rgba(0,0,0,0.22)] outline outline-1 outline-black/5 backdrop-blur md:flex ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.04] text-black/55">
        <Icon size={17} strokeWidth={1.7} />
      </span>
      <span>
        <span className="block text-sm font-medium text-black/80">{label}</span>
        <span className="mt-0.5 block text-xs text-black/45">{detail}</span>
      </span>
    </motion.div>
  );
}

export function HeroBento() {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div
      className="relative mx-auto mt-14 max-w-[1040px] py-8 md:mt-20 md:min-h-[520px] md:py-16"
      aria-label="An appraisal cycle moving from scattered work into one clear view"
    >
      <div
        aria-hidden
        className="absolute inset-x-[12%] top-[8%] h-[78%] rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${COLORS.blue}18 0%, ${COLORS.blue}08 40%, transparent 72%)` }}
      />

      <SourceCard icon={FileSpreadsheet} label="Goals spreadsheet" detail="Last updated yesterday" className="left-0 top-12 -rotate-2" delay={0.22} />
      <SourceCard icon={Mail} label="Reminder emails" detail="Seven still to send" className="right-0 top-24 rotate-2" delay={0.32} />
      <SourceCard icon={Users} label="Manager updates" detail="Waiting on replies" className="bottom-12 left-10 rotate-1" delay={0.42} />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.1, ease }}
        className="relative mx-auto w-full max-w-[690px] overflow-hidden rounded-[28px] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.04),0_32px_90px_-42px_rgba(0,0,0,0.28)] outline outline-1 outline-black/[0.07]"
      >
        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 md:px-7">
          <div className="flex items-center gap-2">
            <span className="flex gap-[3px]" aria-hidden>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.purple }} />
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
            </span>
            <span className="text-xs font-semibold tracking-tight text-black/70">SIA</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-black/60">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
            On track
          </span>
        </div>

        <div className="p-5 md:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/40">Annual review</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-black md:text-3xl" style={{ fontFamily: GROTESK }}>
                Everyone knows what comes next.
              </h2>
            </div>
            <div className="shrink-0">
              <span className="text-4xl font-semibold tracking-[-0.04em] tabular-nums text-black" style={{ fontFamily: GROTESK }}>74%</span>
              <span className="ml-2 text-sm text-black/45">complete</span>
            </div>
          </div>

          <div className="mt-7 h-2 overflow-hidden rounded-full bg-black/[0.05]">
            <motion.div
              initial={reduceMotion ? { width: "74%" } : { width: "0%" }}
              animate={{ width: "74%" }}
              transition={{ duration: 0.9, delay: 0.5, ease }}
              className="h-full rounded-full"
              style={{ backgroundColor: COLORS.blue }}
            />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Goals", "Complete", COLORS.blue],
              ["Reviews", "In progress", COLORS.purple],
              ["Sign-off", "Up next", COLORS.green],
            ].map(([label, status, color], index) => (
              <motion.div
                key={label}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.55 + index * 0.08, ease }}
                className="rounded-2xl bg-[#f7f7f8] p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-black/75">{label}</span>
                  {index === 0 ? (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
                      <Check size={12} strokeWidth={2.2} />
                    </span>
                  ) : (
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  )}
                </div>
                <p className="mt-5 text-xs text-black/60">{status}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
