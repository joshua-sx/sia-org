import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";
import { COLORS, fadeUp, GROTESK } from "./constants";
import { Section } from "./primitives";
import { HeroBento } from "./HeroBento";

export function LandingHero() {
  const reduceMotion = usePrefersReducedMotion();

  const heroContent = (
    <>
      <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-black/50 mb-6">
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
        Performance management for structured orgs
      </span>
      <h1
        className="text-[clamp(44px,6.5vw,78px)] leading-[1.02] tracking-[-0.03em] mb-7 text-balance font-semibold"
        style={{ fontFamily: GROTESK }}
      >
        Run appraisals that actually work.
      </h1>
      <p className="text-lg md:text-xl text-black/60 max-w-[640px] mx-auto leading-relaxed mb-10 text-pretty">
        One system for goal-setting, 360° reviews, and performance analytics — built for government, aviation, healthcare, and education.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 bg-black text-white font-medium px-6 py-3 rounded-full hover:opacity-90 active:scale-[0.96] transition-[opacity,scale] text-sm shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_-12px_rgba(0,0,0,0.25)]"
        >
          Get started free <ArrowRight size={16} />
        </Link>
        <button
          onClick={() =>
            document.querySelector("#how")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-black/80 hover:text-black bg-white border border-black/[0.12] hover:border-black/[0.24] px-6 py-3 rounded-full transition-colors"
        >
          See how it works
        </button>
      </div>
    </>
  );

  return (
    <div className="pt-32 pb-20 md:pt-44 md:pb-32 bg-white">
      <Section>
        {reduceMotion ? (
          <div className="max-w-[860px] mx-auto text-center">{heroContent}</div>
        ) : (
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-[860px] mx-auto text-center">
            {heroContent}
          </motion.div>
        )}

        {reduceMotion ? (
          <HeroBento />
        ) : (
          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}>
            <HeroBento />
          </motion.div>
        )}
      </Section>
    </div>
  );
}
