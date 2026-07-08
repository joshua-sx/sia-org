import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { staticFadeVariants, usePrefersReducedMotion } from "@/hooks/useReducedMotion";
import { fadeUp } from "./constants";

export function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("w-full max-w-[1200px] mx-auto px-5 md:px-8", className)}>
      {children}
    </section>
  );
}

export function SectionReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const variants = reduceMotion ? staticFadeVariants : fadeUp;

  if (reduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={variants} className={className}>
      {children}
    </motion.div>
  );
}

export function IconTile({ icon: Icon, color, size = 36 }: { icon: LucideIcon; color: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{ width: size, height: size, backgroundColor: `${color}1A` }}
    >
      <Icon size={Math.round(size * 0.5)} style={{ color }} />
    </div>
  );
}

export function FadeBlock({
  children,
  className,
  custom,
}: {
  children: React.ReactNode;
  className?: string;
  custom?: number;
}) {
  const reduceMotion = usePrefersReducedMotion();
  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div variants={fadeUp} custom={custom} className={className}>
      {children}
    </motion.div>
  );
}
