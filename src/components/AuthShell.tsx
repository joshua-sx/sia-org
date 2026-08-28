import { ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";

/**
 * Shared frame for /login, /signup, /forgot-password, /reset-password.
 * Warm surface + faint blue radial wash + hairline card, matching the landing hero.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface px-4 py-12">
      {/* Soft blue wash — echoes landing hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--accent-blue) / 0.08), transparent 70%)",
        }}
      />
      <div
        className={`relative w-full ${
          size === "lg" ? "max-w-lg" : "max-w-md"
        } rounded-2xl border border-hairline bg-surface-raised p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]`}
      >
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground font-[Space_Grotesk] text-balance">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm text-ink-muted">
              {description}
            </p>
          )}
        </div>
        {children}
        {footer && (
          <p className="mt-6 text-center text-sm text-ink-muted">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
