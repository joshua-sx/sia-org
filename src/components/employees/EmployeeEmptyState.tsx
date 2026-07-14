import { motion } from "framer-motion";
import { Upload, UserPlus, Download } from "lucide-react";
import { downloadTemplateCsv } from "@/lib/employeeCsv";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  onImport: () => void;
  onAddManual: () => void;
}

export function EmployeeEmptyState({ onImport, onAddManual }: Props) {
  const reduceMotion = usePrefersReducedMotion();

  const options = [
    {
      key: "csv",
      icon: Upload,
      title: "Upload a CSV",
      hint: "Fastest for teams of 10+",
      badge: "Recommended",
      accent: "--accent-yellow",
      onClick: onImport,
    },
    {
      key: "manual",
      icon: UserPlus,
      title: "Add manually",
      hint: "Enter one person at a time",
      badge: null,
      accent: "--accent-blue",
      onClick: onAddManual,
    },
  ] as const;

  const cardClassName =
    "group relative flex flex-col items-start gap-3 rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 text-left hover:border-[hsl(var(--ink-strong)/0.18)] hover:shadow-[0_4px_16px_-6px_rgba(0,0,0,0.08)] active:scale-[0.96] transition-transform";
  const cardStyle = {
    transitionProperty: "border-color, box-shadow, transform",
    transitionDuration: "180ms",
  } as const;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((opt, i) => {
          const content = (
            <>
              {opt.badge && (
                <span
                  className="absolute right-4 top-4 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide"
                  style={{
                    backgroundColor: `hsl(var(${opt.accent}) / 0.12)`,
                    color: `hsl(var(${opt.accent}))`,
                  }}
                >
                  {opt.badge}
                </span>
              )}
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `hsl(var(${opt.accent}) / 0.12)` }}
              >
                <opt.icon className="h-5 w-5" style={{ color: `hsl(var(${opt.accent}))` }} />
              </div>
              <div>
                <p className="text-[15px] font-semibold text-foreground">{opt.title}</p>
                <p className="mt-1 text-xs text-[hsl(var(--ink-muted))]">{opt.hint}</p>
              </div>
            </>
          );

          if (reduceMotion) {
            return (
              <button
                key={opt.key}
                type="button"
                onClick={opt.onClick}
                className={cardClassName}
                style={cardStyle}
              >
                {content}
              </button>
            );
          }

          return (
            <motion.button
              key={opt.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              onClick={opt.onClick}
              className={cardClassName}
              style={cardStyle}
            >
              {content}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center">
        <button
          onClick={downloadTemplateCsv}
          className="inline-flex items-center gap-1.5 text-xs text-[hsl(var(--ink-muted))] hover:text-foreground transition-colors"
          style={{ transitionProperty: "color" }}
        >
          <Download className="h-3.5 w-3.5" />
          Download CSV template
        </button>
      </div>
    </div>
  );
}

export default EmployeeEmptyState;
