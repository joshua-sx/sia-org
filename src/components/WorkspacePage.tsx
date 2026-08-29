import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WorkspacePageProps {
  children: ReactNode;
  className?: string;
  width?: "standard" | "wide";
}

/** Shared content frame for authenticated, top-level product workspaces. */
export function WorkspacePage({
  children,
  className,
  width = "wide",
}: WorkspacePageProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 py-8 sm:px-7 lg:px-10 lg:py-10",
        width === "wide" ? "max-w-[1240px]" : "max-w-5xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
