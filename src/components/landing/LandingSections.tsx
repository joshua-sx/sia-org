import { Link } from "react-router-dom";
import { ArrowRight, Check, Linkedin, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS, GROTESK, INDUSTRIES } from "./constants";
import { Section, SectionReveal } from "./primitives";

const outcomes = [
  {
    title: "One structured org graph.",
    text: "People, teams, reporting lines, roles, goals, and appraisals connected as relationships AI can traverse.",
    color: COLORS.blue,
  },
  {
    title: "ChatGPT asks. Sia decides.",
    text: "Every answer is scoped to what the authenticated user is allowed to see — not blanket access for the AI client.",
    color: COLORS.red,
  },
  {
    title: "Appraisals that stay accurate.",
    text: "Layer 1 is a full performance-review workflow — cycles, goals, assessments, and sign-off — feeding the intelligence layer.",
    color: COLORS.green,
  },
];

const journey = [
  {
    number: "01",
    title: "Structure your organization.",
    text: "Define units, people, reporting lines, and run appraisal cycles in Sia.",
    color: COLORS.blue,
  },
  {
    number: "02",
    title: "Connect ChatGPT.",
    text: "Authorize ChatGPT (or another MCP client) via OAuth to read your org data safely.",
    color: COLORS.purple,
  },
  {
    number: "03",
    title: "Ask anything.",
    text: "Who reports to me? What are my goals? Which appraisals are overdue? — in plain language.",
    color: COLORS.green,
  },
];

export function LandingSections() {
  return (
    <>
      <div id="why" className="bg-black py-24 text-white md:py-36">
        <Section>
          <SectionReveal className="mx-auto max-w-[920px] text-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/45">The problem</p>
            <h2 className="mt-6 text-balance text-[clamp(38px,6vw,72px)] font-semibold leading-[1.02] tracking-[-0.045em]" style={{ fontFamily: GROTESK }}>
              ChatGPT doesn’t know your organization.
            </h2>
            <p className="mx-auto mt-7 max-w-[660px] text-pretty text-lg leading-relaxed text-white/60 md:text-xl">
              People, roles, goals, and performance live in spreadsheets, HR systems, and managers’ heads — not where AI can safely reach them.
            </p>
          </SectionReveal>

          <div className="mx-auto mt-16 grid max-w-[980px] gap-px overflow-hidden rounded-[28px] bg-white/[0.12] outline outline-1 outline-white/[0.1] md:grid-cols-3">
            {[
              ["01", "Fragmented org data"],
              ["02", "No permission layer"],
              ["03", "AI without context"],
            ].map(([number, label], index) => (
              <SectionReveal key={number} className="h-full">
                <div className={cn("h-full bg-[#0b0b0c] p-7 md:min-h-[220px] md:p-9", index === 1 && "bg-[#0e0e0f]")}>
                  <span className="text-xs font-medium tabular-nums text-white/30">{number}</span>
                  <p className="mt-20 text-2xl font-medium tracking-[-0.025em] text-white/90" style={{ fontFamily: GROTESK }}>{label}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      <div id="solution" className="bg-white py-24 md:py-36">
        <Section>
          <SectionReveal className="mx-auto max-w-[820px] text-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/45">With Sia</p>
            <h2 className="mt-5 text-balance text-[clamp(40px,6vw,74px)] font-semibold leading-[1] tracking-[-0.05em] text-black" style={{ fontFamily: GROTESK }}>
              Your organization, AI-ready.
            </h2>
            <p className="mx-auto mt-7 max-w-[590px] text-pretty text-lg leading-relaxed text-black/60">
              Sia is the structured intelligence layer. ChatGPT is the conversation. Together they answer organizational questions safely.
            </p>
          </SectionReveal>

          <div className="mt-16 grid gap-5 md:grid-cols-3">
            {outcomes.map((outcome) => (
              <SectionReveal key={outcome.title} className="h-full">
                <div className="h-full rounded-[24px] bg-[#f6f6f7] p-7 outline outline-1 outline-black/[0.04] md:min-h-[300px] md:p-9">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ backgroundColor: outcome.color }}>
                    <Check size={16} strokeWidth={2} />
                  </span>
                  <h3 className="mt-20 text-2xl font-semibold leading-tight tracking-[-0.03em] text-black" style={{ fontFamily: GROTESK }}>
                    {outcome.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-black/60">{outcome.text}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      <div id="how" className="bg-[#f5f5f7] py-24 md:py-36">
        <Section>
          <SectionReveal className="max-w-[760px]">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/45">How it works</p>
            <h2 className="mt-5 text-balance text-[clamp(38px,5.5vw,68px)] font-semibold leading-[1.02] tracking-[-0.045em] text-black" style={{ fontFamily: GROTESK }}>
              From first step to final sign-off.
            </h2>
          </SectionReveal>

          <div className="mt-14 divide-y divide-black/[0.09] border-y border-black/[0.09]">
            {journey.map((item) => (
              <SectionReveal key={item.number}>
                <div className="grid gap-5 py-8 md:grid-cols-[100px_1fr_1fr] md:items-center md:py-11">
                  <span className="text-sm font-medium tabular-nums" style={{ color: item.color }}>{item.number}</span>
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-black md:text-3xl" style={{ fontFamily: GROTESK }}>{item.title}</h3>
                  <p className="max-w-[430px] text-base leading-relaxed text-black/60">{item.text}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      <div id="who" className="bg-white py-24 md:py-36">
        <Section>
          <div className="grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <SectionReveal>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-black/45">Built for real organizations</p>
              <h2 className="mt-5 max-w-[680px] text-balance text-[clamp(38px,5.3vw,66px)] font-semibold leading-[1.02] tracking-[-0.045em] text-black" style={{ fontFamily: GROTESK }}>
                Your organization has structure. SIA respects it.
              </h2>
              <p className="mt-7 max-w-[580px] text-pretty text-lg leading-relaxed text-black/60">
                Teams, departments, reporting lines, and responsibilities stay clear—so the review fits the way your organization already works.
              </p>
              <p className="mt-6 max-w-[580px] text-sm leading-relaxed text-black/45">
                Built in the Caribbean for organizations that need clarity, accountability, and records they can trust.
              </p>
            </SectionReveal>

            <div className="grid gap-3 sm:grid-cols-2">
              {INDUSTRIES.map((industry) => (
                <SectionReveal key={industry.name} className="h-full">
                  <div className="flex h-full min-h-[150px] flex-col justify-between rounded-[22px] bg-[#f7f7f8] p-6 outline outline-1 outline-black/[0.04]">
                    <industry.icon size={20} strokeWidth={1.6} style={{ color: industry.color }} />
                    <div>
                      <h3 className="font-semibold tracking-[-0.01em] text-black" style={{ fontFamily: GROTESK }}>{industry.name}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-black/50">{industry.desc}</p>
                    </div>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </Section>
      </div>

      <div className="bg-white px-5 pb-6 md:px-8 md:pb-8">
        <Section className="relative overflow-hidden rounded-[32px] bg-black px-6 py-20 text-center text-white md:px-10 md:py-28">
          <div
            aria-hidden
            className="absolute left-1/2 top-0 h-80 w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${COLORS.blue}45 0%, transparent 68%)` }}
          />
          <SectionReveal className="relative mx-auto max-w-[820px]">
            <h2 className="text-balance text-[clamp(40px,6vw,72px)] font-semibold leading-[1] tracking-[-0.05em]" style={{ fontFamily: GROTESK }}>
              Ask your organization anything.
            </h2>
            <p className="mx-auto mt-6 max-w-[540px] text-pretty text-lg leading-relaxed text-white/60">
              Structure people, roles, goals, and performance in Sia — then connect ChatGPT.
            </p>
            <Link
              to="/signup"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              Get started <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
          </SectionReveal>
        </Section>
      </div>
    </>
  );
}

export function LandingFooter() {
  return (
    <footer className="bg-white text-black">
      <Section className="py-12 md:py-16">
        <div className="flex flex-col gap-10 border-t border-black/[0.08] pt-10 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex gap-[3px]" aria-hidden>
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.purple }} />
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
              </span>
              <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: GROTESK }}>SIA</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-black/60">Your organization, AI-ready.</p>
          </div>

          <div className="flex flex-col gap-5 md:items-end">
            <div className="flex items-center gap-5 text-sm text-black/60">
              <Link to="/login" className="transition-colors hover:text-black">Sign in</Link>
              <Link to="/signup" className="transition-colors hover:text-black">Get started</Link>
              <span>Privacy</span>
              <span>Terms</span>
            </div>
            <div className="flex items-center gap-4 text-black/60">
              <span aria-hidden="true" title="Twitter coming soon"><Twitter size={15} strokeWidth={1.6} /></span>
              <span aria-hidden="true" title="LinkedIn coming soon"><Linkedin size={15} strokeWidth={1.6} /></span>
              <span className="text-xs">© {new Date().getFullYear()} SIA</span>
            </div>
          </div>
        </div>
      </Section>
    </footer>
  );
}
