import { Link } from "react-router-dom";

/**
 * SIA wordmark with the landing page's 4-color accent chip.
 * Used across auth pages and the sidebar so the multi-accent identity carries in.
 */
export function BrandMark({
  to = "/",
  size = "md",
}: {
  to?: string;
  size?: "sm" | "md";
}) {
  const wordmark =
    size === "sm"
      ? "text-base font-bold tracking-tight"
      : "text-xl font-bold tracking-tight";
  const dot = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <Link to={to} className="inline-flex items-center gap-2 font-[Space_Grotesk]">
      <span className={`${wordmark} text-foreground`}>SIA</span>
      <span className="flex items-center gap-[3px]">
        <span className={`${dot} rounded-full bg-[hsl(var(--accent-blue))]`} />
        <span className={`${dot} rounded-full bg-[hsl(var(--accent-red))]`} />
        <span className={`${dot} rounded-full bg-[hsl(var(--accent-purple))]`} />
        <span className={`${dot} rounded-full bg-[hsl(var(--accent-green))]`} />
      </span>
    </Link>
  );
}
