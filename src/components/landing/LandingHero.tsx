import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";
import { COLORS, GROTESK } from "./constants";
import { Section } from "./primitives";
import { HeroBento } from "./HeroBento";

const ease = [0.22, 1, 0.36, 1] as const;

export function LandingHero() {
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className="relative overflow-hidden bg-white pb-20 pt-32 md:pb-28 md:pt-44">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[540px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: `radial-gradient(circle, ${COLORS.blue}12 0%, transparent 68%)` }}
      />
      <Section>
        <motion.div
          initial={reduceMotion ? false : "hidden"}
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
          className="relative mx-auto max-w-[980px] text-center"
        >
          <motion.p
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
            className="mb-5 text-xs font-medium uppercase tracking-[0.14em] text-black/45"
          >
            Your organization, AI-ready
          </motion.p>
          <motion.h1
            variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }}
            className="text-balance text-[clamp(48px,7.6vw,92px)] font-semibold leading-[0.98] tracking-[-0.055em] text-black"
            style={{ fontFamily: GROTESK }}
          >
            Structure your org so AI can understand it.
          </motion.h1>
          <motion.p
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
            className="mx-auto mb-10 mt-8 max-w-[650px] text-pretty text-lg leading-relaxed text-black/60 md:text-xl"
          >
            Build people, roles, goals, and performance in Sia. Connect to ChatGPT. Ask your organization anything.
          </motion.p>
          <motion.div
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } } }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.1),0_12px_30px_-16px_rgba(0,0,0,0.4)] transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Get started <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
            <button
              type="button"
              onClick={() => document.querySelector("#how")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })}
              className="rounded-full border border-black/[0.12] bg-white px-6 py-3 text-sm font-medium text-black/75 transition-[color,border-color,transform] duration-150 hover:border-black/25 hover:text-black active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              See how it works
            </button>
          </motion.div>
        </motion.div>

        <HeroBento />
      </Section>
    </div>
  );
}
