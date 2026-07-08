import { useScroll, useSpring, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";
import { COLORS } from "./constants";

export function ScrollProgressBar() {
  const reduceMotion = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  if (reduceMotion) {
    return null;
  }

  return <motion.div className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]" style={{ scaleX, backgroundColor: COLORS.blue }} />;
}
