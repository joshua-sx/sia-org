import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";
import { COLORS, EASE, GROTESK, PRICING_PLANS, cardBase, type PricingPlan } from "./constants";
import { Section, SectionReveal } from "./primitives";

type BillingCycle = "monthly" | "yearly";

function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${COLORS.green}1A` }}
      >
        <Check className="w-2.5 h-2.5" style={{ color: COLORS.green }} strokeWidth={3} />
      </div>
      <span className="text-sm text-black/70 tracking-tight">{text}</span>
    </div>
  );
}

function BillingToggle({
  isYearly,
  onToggle,
}: {
  isYearly: boolean;
  onToggle: () => void;
}) {
  const reduceMotion = usePrefersReducedMotion();
  return (
    <div className="relative z-10 flex items-center gap-3">
      <span className={cn("text-sm font-medium transition-colors", isYearly ? "text-white/50" : "text-white")}>
        Monthly
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={isYearly}
        aria-label="Toggle billing cycle"
        onClick={onToggle}
        className="w-12 h-7 bg-white/15 border border-white/20 rounded-full relative transition-colors active:scale-95 cursor-pointer"
      >
        <motion.span
          className="absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full"
          animate={{ x: isYearly ? 20 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 32 }}
        />
      </button>
      <span className={cn("text-sm font-medium whitespace-nowrap transition-colors", isYearly ? "text-white" : "text-white/50")}>
        Yearly <span style={{ color: COLORS.green }}>· Save 20%</span>
      </span>
    </div>
  );
}

function PricingCard({ plan, isYearly }: { plan: PricingPlan; isYearly: boolean }) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const isCustom = price === null;

  return (
    <SectionReveal className="h-full">
      <div
        className={cn(
          cardBase,
          "relative flex flex-col h-full p-2 transition-shadow",
          plan.isPopular ? "ring-2 ring-black shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]" : "hover:shadow-[0_8px_30px_-16px_rgba(0,0,0,0.15)]"
        )}
      >
        {plan.isPopular && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-wide font-medium bg-black text-white px-3 py-1 rounded-full">
            Most popular
          </span>
        )}

        <div className="bg-[#fafafa] rounded-xl p-6 flex flex-col gap-6 flex-1">
          <div>
            <h3 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: GROTESK }}>
              {plan.name}
            </h3>
            <p className="text-sm text-black/50 leading-relaxed tracking-tight">{plan.description}</p>
          </div>

          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex items-baseline gap-1 h-9">
              {isCustom ? (
                <span className="text-[28px] font-bold tracking-tight" style={{ fontFamily: GROTESK }}>
                  Custom
                </span>
              ) : (
                <>
                  <span className="text-lg font-medium text-black/70">$</span>
                  <div className="overflow-hidden h-9">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={price}
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -16, opacity: 0 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="text-[28px] font-bold tracking-tight leading-none block tabular-nums"
                        style={{ fontFamily: GROTESK }}
                      >
                        {price}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <span className="text-sm text-black/50">/ employee / mo</span>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {plan.ctaText === "Contact sales" ? (
                <Link
                  to="/signup"
                  className="w-full h-11 border border-black/15 text-black rounded-full font-medium text-sm hover:bg-black/[0.03] transition-colors flex items-center justify-center"
                >
                  {plan.ctaText}
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className={cn(
                    "w-full h-11 rounded-full font-medium text-sm transition-colors flex items-center justify-center",
                    plan.isPopular ? "bg-black text-white hover:opacity-90" : "border border-black/15 text-black hover:bg-black/[0.03]"
                  )}
                >
                  {plan.ctaText}
                </Link>
              )}
              <span className="text-xs text-black/40 text-center underline decoration-dotted underline-offset-4">
                {plan.infoText}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 pt-8 flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-black/40">What's included</p>
          <div className="flex flex-col gap-2.5">
            {plan.features.map((feature) => (
              <FeatureItem key={feature} text={feature} />
            ))}
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const isYearly = billingCycle === "yearly";

  return (
    <div id="pricing" className="py-24 md:py-32 bg-[#fafafa]">
      <Section>
        <div className="flex flex-col gap-8">
          <SectionReveal>
            <div className="relative overflow-hidden rounded-2xl bg-black min-h-[220px] flex flex-col md:flex-row items-center md:items-end justify-between gap-8 p-8 md:p-12">
              <div className="absolute inset-0 z-0 opacity-80" aria-hidden>
                <div
                  className="absolute -top-24 -left-16 w-72 h-72 rounded-full blur-3xl"
                  style={{ backgroundColor: `${COLORS.blue}33` }}
                />
                <div
                  className="absolute -bottom-28 right-0 w-72 h-72 rounded-full blur-3xl"
                  style={{ backgroundColor: `${COLORS.red}26` }}
                />
                <div
                  className="absolute top-1/2 left-1/3 w-56 h-56 rounded-full blur-3xl -translate-y-1/2"
                  style={{ backgroundColor: `${COLORS.yellow}1F` }}
                />
              </div>

              <div className="relative z-10 flex flex-col gap-3 max-w-lg">
                <span className="inline-block text-xs uppercase tracking-wide font-medium text-white/50">Pricing</span>
                <h2
                  className="text-[clamp(28px,4vw,40px)] font-bold leading-tight tracking-tight text-white text-balance"
                  style={{ fontFamily: GROTESK }}
                >
                  Flexible plans for structured appraisals.
                </h2>
                <p className="text-white/70 text-base tracking-tight text-pretty">
                  Start free or scale up as your organization grows.
                </p>
              </div>

              <BillingToggle isYearly={isYearly} onToggle={() => setBillingCycle(isYearly ? "monthly" : "yearly")} />
            </div>
          </SectionReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <PricingCard key={plan.id} plan={plan} isYearly={isYearly} />
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}
