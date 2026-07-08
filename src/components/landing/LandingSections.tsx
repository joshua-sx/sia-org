import { Link } from "react-router-dom";
import { ArrowRight, ArrowUp, Check, Sparkles, Twitter, Linkedin, Github } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AI_QUICK_ACTIONS,
  COLORS,
  FEATURES,
  FOOTER_COLUMNS,
  GROTESK,
  INDUSTRIES,
  PRICING_FEATURES,
  STEPS,
  cardBase,
} from "./constants";
import { FadeBlock, IconTile, Section, SectionReveal } from "./primitives";

export function LandingSections() {
  return (
    <>
      <div id="solution" className="py-24 md:py-32 bg-white">
        <Section>
          <SectionReveal className="text-center max-w-[640px] mx-auto mb-14">
            <span className="inline-block text-xs uppercase tracking-wide font-medium text-black/50 mb-3">Product</span>
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-0.02em] leading-[1.05] mb-4 text-balance"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              One system for every phase.
            </h2>
            <p className="text-black/60 text-pretty">Goals, reviews, analytics, and structure — connected, not scattered.</p>
          </SectionReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <SectionReveal key={f.label} className={f.span}>
                <FadeBlock custom={i} className={cn(cardBase, "p-6 h-full flex flex-col gap-4")}>
                  <IconTile icon={f.icon} color={f.color} />
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] uppercase tracking-wide font-medium" style={{ color: f.color }}>
                      {f.label}
                    </span>
                    <h3 className="text-xl font-semibold tracking-tight text-balance" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {f.title}
                    </h3>
                    <p className="text-sm text-black/60 leading-relaxed text-pretty">{f.desc}</p>
                  </div>
                </FadeBlock>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      <div id="who" className="py-24 md:py-32 bg-[#fafafa]">
        <Section>
          <SectionReveal className="text-center max-w-[640px] mx-auto mb-14">
            <span className="inline-block text-xs uppercase tracking-wide font-medium text-black/50 mb-3">For</span>
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-0.02em] leading-[1.05] mb-4 text-balance"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Built for structured organizations.
            </h2>
            <p className="text-black/60 text-pretty">SIA works wherever performance reviews follow a formal structure.</p>
          </SectionReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {INDUSTRIES.map((ind, i) => (
              <SectionReveal key={ind.name}>
                <FadeBlock custom={i} className={cn(cardBase, "p-6 flex flex-col gap-4 h-full")}>
                  <IconTile icon={ind.icon} color={ind.color} />
                  <div>
                    <h3 className="font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {ind.name}
                    </h3>
                    <p className="text-sm text-black/50 leading-relaxed mt-1">{ind.desc}</p>
                  </div>
                </FadeBlock>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      <div id="how" className="py-24 md:py-32 bg-white">
        <Section>
          <SectionReveal className="text-center max-w-[640px] mx-auto mb-14">
            <span className="inline-block text-xs uppercase tracking-wide font-medium text-black/50 mb-3">How it works</span>
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-0.02em] leading-[1.05] mb-4 text-balance"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Up and running in four steps.
            </h2>
            <p className="text-black/60 text-pretty">From account creation to your first cycle in under an hour.</p>
          </SectionReveal>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <SectionReveal key={s.num}>
                <FadeBlock custom={i} className="flex flex-col items-center text-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white tabular-nums"
                    style={{ backgroundColor: s.color, fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {s.num}
                  </span>
                  <h3 className="font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {s.title}
                  </h3>
                  <p className="text-sm text-black/50 leading-relaxed">{s.desc}</p>
                </FadeBlock>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      <div id="ask-sia" className="py-24 md:py-32 bg-white">
        <Section>
          <SectionReveal className="text-center max-w-[720px] mx-auto mb-12">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide font-medium text-black/50 mb-4">
              <Sparkles size={12} style={{ color: COLORS.blue }} />
              Coming soon — Sia AI
            </span>
            <h2
              className="text-[clamp(34px,5vw,60px)] leading-[1.05] tracking-[-0.03em] mb-5 text-balance font-semibold"
              style={{ fontFamily: GROTESK }}
            >
              Ask Sia what's happening in your cycle.
            </h2>
            <p className="text-black/60 leading-relaxed text-pretty max-w-[560px] mx-auto">
              Turn goals, reviews, feedback, and structure into answers your leadership team can act on.
            </p>
          </SectionReveal>

          <SectionReveal className="max-w-[820px] mx-auto">
            <div className="rounded-[28px] border border-black/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_60px_-20px_rgba(0,0,0,0.12)] p-5 md:p-6">
              <div className="min-h-[104px] flex items-start">
                <p className="text-base md:text-lg text-black/35 leading-relaxed">
                  Ask about appraisal progress, team performance, overdue reviews, or goal outcomes…
                </p>
              </div>
              <div className="flex items-center justify-between pt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-black/40">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.yellow }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
                  <span className="ml-1">Sia AI · Preview</span>
                </span>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  aria-label="Ask Sia (coming soon)"
                  title="Coming soon"
                  className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center opacity-50 cursor-not-allowed"
                >
                  <ArrowUp size={16} />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2.5 mt-6">
              {AI_QUICK_ACTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Coming soon"
                  className="text-sm text-black/40 bg-white border border-black/[0.08] px-4 py-2 rounded-full cursor-not-allowed"
                >
                  {a}
                </button>
              ))}
            </div>
          </SectionReveal>
        </Section>
      </div>

      <div className="py-24 md:py-32 bg-[#fafafa]">
        <Section>
          <SectionReveal>
            <div className={cn(cardBase, "p-8 md:p-12 max-w-[820px] mx-auto text-center")}>
              <div className="flex justify-center gap-1.5 mb-5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.blue }} />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.red }} />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.yellow }} />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.green }} />
              </div>
              <span className="inline-block text-xs uppercase tracking-wide font-medium text-black/50 mb-3">
                Built for the Caribbean
              </span>
              <h2
                className="text-[clamp(24px,3vw,36px)] font-bold tracking-[-0.02em] leading-[1.15] mb-4 text-balance"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Built for the way Caribbean government orgs actually run appraisals.
              </h2>
              <p className="text-black/60 leading-relaxed max-w-[620px] mx-auto text-pretty">
                Designed around the real hierarchies, cycles, and review formats used across ministries, health authorities, and statutory bodies — not adapted from generic HR software.
              </p>
            </div>
          </SectionReveal>
        </Section>
      </div>

      <div id="pricing" className="py-24 md:py-32 bg-white">
        <Section>
          <SectionReveal className="text-center max-w-[640px] mx-auto mb-14">
            <span className="inline-block text-xs uppercase tracking-wide font-medium text-black/50 mb-3">Pricing</span>
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-0.02em] leading-[1.05] mb-4 text-balance"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Simple, transparent pricing.
            </h2>
            <p className="text-black/60 text-pretty">One plan. Everything included. Scale as you grow.</p>
          </SectionReveal>
          <SectionReveal>
            <div className={cn(cardBase, "p-8 md:p-10 max-w-[520px] mx-auto")}>
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.yellow }} />
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide text-black/50">Enterprise</span>
                </div>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-5xl font-bold tracking-tight tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    $6
                  </span>
                  <span className="text-black/50 text-sm">/ employee / month</span>
                </div>
              </div>
              <ul className="flex flex-col gap-3 mb-8">
                {PRICING_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color: COLORS.green }} />
                    <span className="text-black/80">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="w-full inline-flex items-center justify-center gap-2 bg-black text-white font-medium px-6 py-3 rounded-full hover:opacity-90 active:scale-[0.96] transition-[opacity,scale] text-sm"
              >
                Get started free <ArrowRight size={16} />
              </Link>
            </div>
          </SectionReveal>
        </Section>
      </div>

      <div className="py-24 md:py-32 bg-black">
        <Section className="text-center">
          <SectionReveal>
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-0.02em] leading-[1.05] mb-4 text-white text-balance"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Your next{" "}
              <span className="relative inline-block">
                cycle
                <svg
                  aria-hidden
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                  className="absolute left-0 right-0 -bottom-1 w-full h-2"
                >
                  <path d="M0,6 Q50,10 100,4" fill="none" stroke={COLORS.blue} strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>{" "}
              starts here.
            </h2>
            <p className="text-white/60 max-w-[480px] mx-auto mb-8 text-pretty">
              Set up your org structure, configure your first cycle, and run appraisals that matter.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white text-black font-medium px-6 py-3 rounded-full hover:opacity-90 active:scale-[0.96] transition-[opacity,scale] text-sm"
            >
              Get started free <ArrowRight size={16} />
            </Link>
          </SectionReveal>
        </Section>
      </div>
    </>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-black text-white">
      <Section className="pt-20 md:pt-28 pb-10">
        <div className="max-w-[820px] mb-16 md:mb-24">
          <h2
            className="text-[clamp(36px,5.5vw,68px)] leading-[1.05] tracking-[-0.03em] text-balance font-semibold"
            style={{ fontFamily: GROTESK }}
          >
            Structured reviews.
            <br />
            <span className="text-white/60">Smarter organizations.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-16">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-white mb-4 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href} className="text-sm text-white/55 hover:text-white transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <span className="text-sm text-white/35">{link.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex gap-[3px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.yellow }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
              </span>
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                SIA
              </span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Performance appraisal software for structured organizations. Built in the Caribbean.
            </p>
          </div>
          <div className="flex flex-col md:items-end gap-4">
            <div className="flex items-center gap-4 text-white/35">
              <span aria-label="Twitter (coming soon)" title="Coming soon"><Twitter size={16} /></span>
              <span aria-label="LinkedIn (coming soon)" title="Coming soon"><Linkedin size={16} /></span>
              <span aria-label="GitHub (coming soon)" title="Coming soon"><Github size={16} /></span>
            </div>
            <div className="flex items-center gap-5 text-xs text-white/40">
              <span>© {new Date().getFullYear()} SIA</span>
              <span className="text-white/35">Privacy</span>
              <span className="text-white/35">Terms</span>
            </div>
          </div>
        </div>
      </Section>
    </footer>
  );
}
