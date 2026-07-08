import { useReducedMotion } from "framer-motion";

/** True when the user prefers reduced motion (OS setting). */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion() ?? false;
}

/** Framer Motion variants with no movement — use when reduced motion is preferred. */
export const staticFadeVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
} as const;
