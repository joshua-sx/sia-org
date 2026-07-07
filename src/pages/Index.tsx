import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useInView,
  useScroll,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  Menu,
  X,
  Target,
  ClipboardCheck,
  BarChart3,
  Building2,
  Plane,
  Heart,
  GraduationCap,
  Check,
  ArrowUp,
  Network,
  CheckCircle2,
  Sparkles,
  Twitter,
  Linkedin,
  Github,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { PageHead } from "@/components/PageHead";

/* ─────────────────────────── CONSTANTS ─────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as any;

const COLORS = {
  blue: "#4285F4",
  red: "#EA4335",
  yellow: "#FBBC05",
  green: "#34A853",
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: EASE },
  }),
};

/* ─────────────────────────── DATA ─────────────────────────── */

const NAV_LINKS = [
  { label: "Features", href: "#solution" },
  { label: "Who It\u2019s For", href: "#who" },
  { label: "How It Works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
];

const FEATURES = [
  {
    icon: Target,
    color: COLORS.blue,
    label: "Goal Setting",
    title: "Set goals that connect to outcomes.",
    desc: "Cascade objectives from org level down to every employee. Track progress in real time across cycles.",
    span: "md:col-span-2",
  },
  {
    icon: ClipboardCheck,
    color: COLORS.red,
    label: "360° Reviews",
    title: "Feedback from every angle.",
    desc: "Self, peer, and manager reviews in one workflow. Configurable forms per cycle.",
    span: "md:col-span-1",
  },
  {
    icon: BarChart3,
    color: COLORS.yellow,
    label: "Analytics",
    title: "See the full picture.",
    desc: "Dashboards, exportable reports, and trend analysis across departments.",
    span: "md:col-span-1",
  },
  {
    icon: Network,
    color: COLORS.green,
    label: "Org Structure",
    title: "Mirror your real hierarchy.",
    desc: "Ministries, divisions, teams — configured once, respected everywhere.",
    span: "md:col-span-2",
  },
];

const INDUSTRIES = [
  { icon: Building2, color: COLORS.blue, name: "Government", desc: "Ministries, departments, statutory bodies." },
  { icon: Plane, color: COLORS.red, name: "Aviation", desc: "Airlines, airport authorities, MROs." },
  { icon: Heart, color: COLORS.yellow, name: "Healthcare", desc: "Hospitals, clinics, health authorities." },
  { icon: GraduationCap, color: COLORS.green, name: "Education", desc: "Universities, school boards, training institutes." },
];

const STEPS = [
  { num: "1", color: COLORS.blue, title: "Define your structure", desc: "Set up your org hierarchy — ministries, divisions, units." },
  { num: "2", color: COLORS.red, title: "Configure cycles", desc: "Choose review type, frequency, and participants." },
  { num: "3", color: COLORS.yellow, title: "Run appraisals", desc: "Employees and managers complete reviews in-app." },
  { num: "4", color: COLORS.green, title: "Review & act", desc: "Analyze results, export reports, plan next steps." },
];

const PRICING_FEATURES = [
  "Unlimited appraisal cycles",
  "Org structure builder",
  "360° review workflows",
  "Goal cascading & tracking",
  "Real-time analytics dashboard",
  "CSV import / export",
  "Role-based access control",
  "Dedicated onboarding support",
];

const AI_QUICK_ACTIONS = [
  "Summarize this cycle",
  "Find overdue reviews",
  "Compare departments",
  "Draft feedback",
];

const FOOTER_COLUMNS: { heading: string; links: string[] }[] = [
  { heading: "Product", links: ["Features", "Reviews", "Goals", "Analytics", "Pricing"] },
  { heading: "Solutions", links: ["Government", "Aviation", "Healthcare", "Education"] },
  { heading: "Resources", links: ["Blog", "Help Center", "Templates", "Security"] },
  { heading: "Company", links: ["About", "Contact", "Privacy", "Terms"] },
];

const SERIF = "'Instrument Serif', 'Times New Roman', serif";







/* ─────────────────────────── HELPERS ─────────────────────────── */

function Section({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("w-full max-w-[1200px] mx-auto px-5 md:px-8", className)}>
      {children}
    </section>
  );
}

function SectionReveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? "visible" : "hidden"} variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

function IconTile({ icon: Icon, color, size = 36 }: { icon: any; color: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{ width: size, height: size, backgroundColor: `${color}1A` /* ~10% */ }}
    >
      <Icon size={Math.round(size * 0.5)} style={{ color }} />
    </div>
  );
}

const cardBase = "bg-white border border-black/[0.08] rounded-xl";

/* ─────────────────────────── SCROLL PROGRESS ─────────────────── */

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div className="fixed top-0 left-0 right-0 h-[2px] origin-left z-[60]" style={{ scaleX, backgroundColor: COLORS.blue }} />;
}

/* ─────────────────────────── BACK TO TOP ─────────────────────── */

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-80 active:scale-[0.96] transition-[opacity,scale]"
          aria-label="Back to top"
        >
          <ArrowUp size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────── NAVBAR ─────────────────────────── */

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const smoothScroll = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled ? "bg-white/85 backdrop-blur-md border-b border-black/[0.08]" : "bg-transparent border-b border-transparent"
      )}
    >
      <nav className="max-w-[1200px] mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-black" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <span className="flex gap-[3px]">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.yellow }} />
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
          </span>
          SIA
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <button key={l.label} onClick={() => smoothScroll(l.href)} className="text-sm text-black/70 hover:text-black transition-colors">
              {l.label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-black/70 hover:text-black transition-colors">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="text-sm font-medium bg-black text-white px-5 py-2 rounded-full hover:opacity-90 active:scale-[0.96] transition-[opacity,scale] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
          >
            Get started free
          </Link>
        </div>
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-black/[0.08] overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <button key={l.label} onClick={() => smoothScroll(l.href)} className="text-left text-sm text-black/70 hover:text-black">
                  {l.label}
                </button>
              ))}
              <hr className="border-black/[0.08]" />
              <Link to="/login" className="text-sm text-black/70" onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
              <Link to="/signup" className="text-sm font-medium bg-black text-white px-5 py-2.5 rounded-full text-center" onClick={() => setMobileOpen(false)}>
                Get started free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─────────────────────────── HERO BENTO ─────────────────────── */

function HeroBento() {
  return (
    <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 md:gap-5 md:auto-rows-[180px]">
      {/* Tile A — Dashboard mock */}
      <motion.div
        variants={fadeUp}
        custom={0}
        className={cn(cardBase, "md:col-span-4 md:row-span-2 overflow-hidden flex flex-col")}
      >
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-black/[0.06]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.red }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.yellow }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.green }} />
          <span className="ml-3 text-xs text-black/40">SIA — Q3 Appraisal Cycle</span>
        </div>
        <div className="p-5 md:p-7 grid grid-cols-3 gap-5 flex-1">
          {[
            { label: "Completion", value: "87%", bar: 87, color: COLORS.blue },
            { label: "Submitted", value: "342", bar: 68, color: COLORS.green },
            { label: "Avg. Rating", value: "4.2", bar: 84, color: COLORS.yellow },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-black/40 font-medium">{s.label}</span>
              <span className="text-3xl font-bold tracking-tight tabular-nums" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {s.value}
              </span>
              <div className="w-full h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${s.bar}%`, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>
        {/* fake table rows */}
        <div className="px-5 md:px-7 pb-6 space-y-2">
          {[
            { name: "Engineering", pct: 92, color: COLORS.blue },
            { name: "Operations", pct: 78, color: COLORS.green },
            { name: "Customer Success", pct: 64, color: COLORS.yellow },
          ].map((r) => (
            <div key={r.name} className="flex items-center gap-4 text-xs">
              <span className="w-40 text-black/70 truncate">{r.name}</span>
              <div className="flex-1 h-1 bg-black/[0.05] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
              </div>
              <span className="tabular-nums text-black/50 w-8 text-right">{r.pct}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tile B — Goals cascaded */}
      <motion.div variants={fadeUp} custom={1} className={cn(cardBase, "md:col-span-2 p-5 flex flex-col justify-between")}>
        <IconTile icon={Target} color={COLORS.blue} />
        <div>
          <div className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            1,284
          </div>
          <div className="text-xs text-black/50 mt-1">Goals cascaded this quarter</div>
        </div>
      </motion.div>

      {/* Tile C — Review submitted */}
      <motion.div variants={fadeUp} custom={2} className={cn(cardBase, "md:col-span-2 p-5 flex flex-col gap-3")}>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} style={{ color: COLORS.green }} />
          <span className="text-xs font-medium text-black/70">Review submitted</span>
        </div>
        <div className="text-sm text-black/60 leading-snug">
          <span className="font-medium text-black">Priya M.</span> completed her 360° review for Q3
        </div>
        <div className="flex gap-1.5 mt-auto">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${COLORS.green}1A`, color: COLORS.green }}>
            On time
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-black/[0.05] text-black/60">Manager</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────── LANDING PAGE ─────────────────────── */

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <PageHead
        title="SIA — Performance appraisals for structured orgs"
        description="Goal-setting, 360° reviews, and performance analytics for government, aviation, healthcare, and education."
        path="/"
      />
      <ScrollProgressBar />
      <Navbar />
      <BackToTop />

      {/* Hero */}
      <div className="pt-32 pb-20 md:pt-44 md:pb-32 bg-white">
        <Section>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-[860px] mx-auto text-center">
            <span className="inline-flex items-center gap-2 text-xs font-medium tracking-wide uppercase text-black/50 mb-6">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
              Performance management for structured orgs
            </span>
            <h1
              className="text-[clamp(44px,6.5vw,78px)] leading-[1.02] tracking-[-0.02em] mb-7 text-balance font-normal"
              style={{ fontFamily: SERIF }}
            >
              Run appraisals that <em className="italic">actually</em> work.
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
                onClick={() => document.querySelector("#how")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex items-center gap-2 text-sm font-medium text-black/80 hover:text-black bg-white border border-black/[0.12] hover:border-black/[0.24] px-6 py-3 rounded-full transition-colors"
              >
                See how it works
              </button>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }}>
            <HeroBento />
          </motion.div>
        </Section>
      </div>




      {/* Solution Bento */}
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
                <motion.div custom={i} variants={fadeUp} className={cn(cardBase, "p-6 h-full flex flex-col gap-4")}>
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
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      {/* Who It's For */}
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
                <motion.div custom={i} variants={fadeUp} className={cn(cardBase, "p-6 flex flex-col gap-4 h-full")}>
                  <IconTile icon={ind.icon} color={ind.color} />
                  <div>
                    <h3 className="font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {ind.name}
                    </h3>
                    <p className="text-sm text-black/50 leading-relaxed mt-1">{ind.desc}</p>
                  </div>
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      {/* How It Works */}
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
                <motion.div custom={i} variants={fadeUp} className="flex flex-col items-center text-center gap-3">
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
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      {/* Positioning */}
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

      {/* Pricing */}
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
                className="w-full inline-flex items-center justify-center gap-2 bg-black text-white font-medium px-6 py-3 rounded-lg hover:opacity-90 active:scale-[0.96] transition-[opacity,scale] text-sm"
              >
                Get started free <ArrowRight size={16} />
              </Link>
            </div>
          </SectionReveal>
        </Section>
      </div>

      {/* Final CTA */}
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
              className="inline-flex items-center gap-2 bg-white text-black font-medium px-6 py-3 rounded-lg hover:opacity-90 active:scale-[0.96] transition-[opacity,scale] text-sm"
            >
              Get started free <ArrowRight size={16} />
            </Link>
          </SectionReveal>
        </Section>
      </div>

      {/* Footer */}
      <footer className="py-10 bg-white border-t border-black/[0.08]">
        <Section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
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
              <p className="text-sm text-black/50 leading-relaxed max-w-md">
                Performance appraisal software for structured organizations.
              </p>
            </div>
            <div className="flex flex-col sm:items-end gap-1 text-xs text-black/40">
              <span>© {new Date().getFullYear()} SIA</span>
              <span>Built in the Caribbean 🌴</span>
            </div>
          </div>
        </Section>
      </footer>

    </div>
  );
};

export default Index;
