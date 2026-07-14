import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";

interface Stat {
  value: number | string;
  label: string;
}

interface StepSuccessProps {
  eyebrow: string;
  title: string;
  description: string;
  stats?: Stat[];
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function StepSuccess({
  eyebrow,
  title,
  description,
  stats,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: StepSuccessProps) {
  const reduce = usePrefersReducedMotion();
  return (
    <div className="mx-auto max-w-2xl px-6 py-14 text-center">
      <motion.div
        initial={{ scale: reduce ? 1 : 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: "hsl(var(--accent-green) / 0.14)" }}
      >
        <motion.div
          initial={{ scale: reduce ? 1 : 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", duration: 0.4, bounce: 0 }}
        >
          <Check className="h-8 w-8" strokeWidth={3} style={{ color: "hsl(var(--accent-green))" }} />
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: reduce ? 0 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.3 }}
        className="text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--accent-green))] font-medium"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: reduce ? 0 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.3 }}
        className="mt-2 text-[26px] font-semibold tracking-[-0.4px] text-foreground font-[Space_Grotesk] text-balance"
      >
        {title}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: reduce ? 0 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="mt-2 text-sm text-[hsl(var(--ink-muted))] max-w-md mx-auto text-pretty"
      >
        {description}
      </motion.p>

      {stats && stats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-8 inline-flex items-center gap-8 rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-6 py-4"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-semibold text-foreground tabular-nums">{s.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="mt-10 flex items-center justify-center gap-3"
      >
        <Button onClick={onPrimary}>
          {primaryLabel}
        </Button>
        {secondaryLabel && onSecondary && (
          <Button
            variant="ghost"
            onClick={onSecondary}
            className="text-[hsl(var(--ink-muted))]"
          >
            {secondaryLabel}
          </Button>
        )}
      </motion.div>
    </div>
  );
}

export default StepSuccess;
