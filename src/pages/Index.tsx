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
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────── CONSTANTS ─────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as any;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: EASE },
  }),
};

/* ─────────────────────────── DATA ─────────────────────────── */

const NAV_LINKS = [
  { label: "Features", href: "#solution" },
  { label: "Who It\u2019s For", href: "#who" },
  { label: "How It Works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
];

const PAIN_POINTS = [
  { num: "01", title: "Scattered spreadsheets", desc: "Appraisal data lives in dozens of files nobody can find." },
  { num: "02", title: "Missed deadlines", desc: "Cycles drag on because nobody knows who\u2019s done and who hasn\u2019t." },
  { num: "03", title: "Zero visibility", desc: "Leaders can\u2019t see performance trends across the org." },
];

const FEATURES = [
  {
    icon: Target,
    label: "Goal Setting",
    title: "Set goals that connect to outcomes.",
    desc: "Cascade objectives from org level down to every employee. Track progress in real time.",
    color: "bg-amber-300",
    span: "col-span-1 md:col-span-2",
  },
  {
    icon: ClipboardCheck,
    label: "360\u00b0 Reviews",
    title: "Collect feedback from everyone.",
    desc: "Self, peer, and manager reviews in one workflow. Configurable forms per cycle.",
    color: "bg-rose-400",
    span: "col-span-1",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    title: "See the full picture.",
    desc: "Dashboards, exportable reports, and trend analysis across departments and cycles.",
    color: "bg-sky-400",
    span: "col-span-1",
  },
];

const INDUSTRIES = [
  { icon: Building2, name: "Government", desc: "Ministries, departments, statutory bodies." },
  { icon: Plane, name: "Aviation", desc: "Airlines, airport authorities, MROs." },
  { icon: Heart, name: "Healthcare", desc: "Hospitals, clinics, health authorities." },
  { icon: GraduationCap, name: "Education", desc: "Universities, school boards, training institutes." },
];

const STEPS = [
  { num: "1", title: "Define your structure", desc: "Set up your org hierarchy \u2014 ministries, divisions, units." },
  { num: "2", title: "Configure cycles", desc: "Choose review type, frequency, and participants." },
  { num: "3", title: "Run appraisals", desc: "Employees and managers complete reviews in-app." },
  { num: "4", title: "Review & act", desc: "Analyze results, export reports, plan next steps." },
];

const PRICING_FEATURES = [
  "Unlimited appraisal cycles",
  "Org structure builder",
  "360\u00b0 review workflows",
  "Goal cascading & tracking",
  "Real-time analytics dashboard",
  "CSV import / export",
  "Role-based access control",
  "Dedicated onboarding support",
];

const FOOTER_COLS = [
  { heading: "Product", links: [{ label: "Features", href: "#solution" }, { label: "Pricing", href: "#pricing" }, { label: "How It Works", href: "#how" }] },
  { heading: "Company", links: [{ label: "About", href: "#" }, { label: "Blog", href: "#" }, { label: "Careers", href: "#" }] },
  { heading: "Legal", links: [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Security", href: "#" }] },
];

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

/* ─────────────────────────── SCROLL PROGRESS ─────────────────── */

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div className="fixed top-0 left-0 right-0 h-[2px] bg-[#0075de] origin-left z-[60]" style={{ scaleX }} />;
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
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:opacity-80 transition-opacity"
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
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/90 backdrop-blur-md border-b border-[rgba(0,0,0,0.1)]" : "bg-transparent"
      )}
    >
      <nav className="max-w-[1200px] mx-auto px-5 md:px-8 h-14 flex items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          SIA
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <button key={l.label} onClick={() => smoothScroll(l.href)} className="text-sm text-foreground/70 hover:text-foreground transition-colors">
              {l.label}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link to="/signup" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            Get started free
          </Link>
        </div>
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-[rgba(0,0,0,0.1)] overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <button key={l.label} onClick={() => smoothScroll(l.href)} className="text-left text-sm text-foreground/70 hover:text-foreground">
                  {l.label}
                </button>
              ))}
              <hr className="border-[rgba(0,0,0,0.1)]" />
              <Link to="/login" className="text-sm text-foreground/70" onClick={() => setMobileOpen(false)}>
                Sign in
              </Link>
              <Link to="/signup" className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-lg text-center" onClick={() => setMobileOpen(false)}>
                Get started free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ─────────────────────────── DASHBOARD MOCKUP ─────────────────── */

function DashboardMockup() {
  return (
    <div className="w-full max-w-[900px] mx-auto mt-12 md:mt-16">
      <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.1)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(0,0,0,0.1)]">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs text-foreground/40">SIA \u2014 Appraisal Dashboard</span>
        </div>
        <div className="p-6 md:p-8 grid grid-cols-3 gap-4">
          {[
            { label: "Completion Rate", value: "87%", bar: 87 },
            { label: "Reviews Submitted", value: "342", bar: 68 },
            { label: "Avg. Rating", value: "4.2", bar: 84 },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-2">
              <span className="text-xs text-foreground/50">{s.label}</span>
              <span className="text-2xl font-bold tracking-tight">{s.value}</span>
              <div className="w-full h-1.5 bg-[rgba(0,0,0,0.05)] rounded-full overflow-hidden">
                <div className="h-full bg-[#0075de] rounded-full" style={{ width: `${s.bar}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── LANDING PAGE ─────────────────────── */

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-foreground" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <ScrollProgressBar />
      <Navbar />
      <BackToTop />

      {/* Hero */}
      <div className="pt-28 pb-16 md:pt-36 md:pb-24 bg-[#f6f5f4]">
        <Section>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-[820px] mx-auto text-center">
            <span className="inline-block text-xs font-medium tracking-wide uppercase text-foreground/50 mb-4">
              Performance management for structured orgs
            </span>
            <h1
              className="text-[clamp(40px,6vw,72px)] font-bold leading-[1.05] tracking-[-2px] mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Run appraisals that actually work.
            </h1>
            <p className="text-lg md:text-xl text-foreground/60 max-w-[620px] mx-auto leading-relaxed mb-8">
              One system for goal-setting, 360° reviews, and performance analytics — built for government, aviation, healthcare, and education.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-foreground text-background font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                Get started free <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => document.querySelector("#how")?.scrollIntoView({ behavior: "smooth" })}
                className="text-sm text-[#0075de] font-medium hover:underline inline-flex items-center gap-1"
              >
                See how it works →
              </button>
            </div>
          </motion.div>
          <DashboardMockup />
        </Section>
      </div>

      {/* Problem */}
      <div className="py-20 md:py-28 bg-white">
        <Section>
          <SectionReveal className="text-center max-w-[640px] mx-auto mb-14">
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-1.5px] leading-[1.1] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Still using spreadsheets?
            </h2>
            <p className="text-foreground/60">
              Most orgs run appraisals with tools that weren't built for the job.
            </p>
          </SectionReveal>
          <div className="grid md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p, i) => (
              <SectionReveal key={p.num}>
                <motion.div custom={i} variants={fadeUp} className="flex flex-col gap-3">
                  <span className="text-xs font-mono text-foreground/30">{p.num}</span>
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{p.desc}</p>
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      {/* Solution Bento */}
      <div id="solution" className="py-20 md:py-28 bg-[#f6f5f4]">
        <Section>
          <SectionReveal className="text-center max-w-[640px] mx-auto mb-14">
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-1.5px] leading-[1.1] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              One system for every phase.
            </h2>
            <p className="text-foreground/60">Goals, reviews, and analytics — connected, not scattered.</p>
          </SectionReveal>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <SectionReveal key={f.label} className={f.span}>
                <motion.div custom={i} variants={fadeUp} className="bg-white rounded-xl border border-[rgba(0,0,0,0.1)] overflow-hidden h-full flex flex-col">
                  <div className={cn("h-2 w-full", f.color)} />
                  <div className="p-6 flex flex-col gap-3 flex-1">
                    <div className="flex items-center gap-2 text-xs text-foreground/50 font-medium uppercase tracking-wide">
                      <f.icon size={14} />
                      {f.label}
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">{f.title}</h3>
                    <p className="text-sm text-foreground/60 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      {/* Who It's For */}
      <div id="who" className="py-20 md:py-28 bg-white">
        <Section>
          <SectionReveal className="text-center max-w-[640px] mx-auto mb-14">
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-1.5px] leading-[1.1] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Built for structured organizations.
            </h2>
            <p className="text-foreground/60">SIA works wherever performance reviews follow a formal structure.</p>
          </SectionReveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {INDUSTRIES.map((ind, i) => (
              <SectionReveal key={ind.name}>
                <motion.div custom={i} variants={fadeUp} className="bg-[#f6f5f4] rounded-xl p-6 flex flex-col gap-3 h-full">
                  <ind.icon size={24} className="text-foreground/70" />
                  <h3 className="font-semibold">{ind.name}</h3>
                  <p className="text-sm text-foreground/50 leading-relaxed">{ind.desc}</p>
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      {/* How It Works */}
      <div id="how" className="py-20 md:py-28 bg-[#f6f5f4]">
        <Section>
          <SectionReveal className="text-center max-w-[640px] mx-auto mb-14">
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-1.5px] leading-[1.1] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Up and running in four steps.
            </h2>
            <p className="text-foreground/60">From account creation to your first cycle in under an hour.</p>
          </SectionReveal>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <SectionReveal key={s.num}>
                <motion.div custom={i} variants={fadeUp} className="flex flex-col gap-3">
                  <span className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">
                    {s.num}
                  </span>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-sm text-foreground/50 leading-relaxed">{s.desc}</p>
                </motion.div>
              </SectionReveal>
            ))}
          </div>
        </Section>
      </div>

      {/* Trust */}
      <div className="py-20 md:py-28 bg-white">
        <Section>
          <SectionReveal>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {[
                { stat: "100+", label: "Organizations onboarded" },
                { stat: "3\u00d7", label: "Faster cycle completion" },
                { stat: "0", label: "Spreadsheets needed" },
              ].map((t, i) => (
                <motion.div key={t.label} custom={i} variants={fadeUp} className="text-center md:text-left">
                  <div className="text-4xl md:text-5xl font-bold tracking-tight mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {t.stat}
                  </div>
                  <div className="text-sm text-foreground/50">{t.label}</div>
                </motion.div>
              ))}
            </div>
          </SectionReveal>
          <SectionReveal>
            <blockquote className="bg-[#f6f5f4] rounded-xl p-8 md:p-10 border-l-4 border-foreground">
              <p className="text-lg md:text-xl leading-relaxed mb-4 italic text-foreground/80">
                "We replaced three tools and cut our review cycle from 12 weeks to 4. SIA just works."
              </p>
              <cite className="text-sm text-foreground/50 not-italic">{"\u2014"} HR Director, Caribbean Government Ministry</cite>
            </blockquote>
          </SectionReveal>
        </Section>
      </div>

      {/* Pricing */}
      <div id="pricing" className="py-20 md:py-28 bg-[#f6f5f4]">
        <Section>
          <SectionReveal>
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-1.5px] leading-[1.1] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Simple, transparent pricing.
            </h2>
            <p className="text-foreground/60 max-w-[500px] mb-12">One plan. Everything included. Scale as you grow.</p>
          </SectionReveal>
          <SectionReveal>
            <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.1)] p-8 md:p-10 max-w-[520px]">
              <div className="mb-6">
                <span className="text-xs font-medium uppercase tracking-wide text-foreground/50">Enterprise</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    $6
                  </span>
                  <span className="text-foreground/50 text-sm">/ employee / month</span>
                </div>
              </div>
              <ul className="flex flex-col gap-3 mb-8">
                {PRICING_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="mt-0.5 text-emerald-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/signup"
                className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                Get started free <ArrowRight size={16} />
              </Link>
            </div>
          </SectionReveal>
        </Section>
      </div>

      {/* Final CTA */}
      <div className="py-20 md:py-28 bg-foreground">
        <Section className="text-center">
          <SectionReveal>
            <h2
              className="text-[clamp(32px,4.5vw,54px)] font-bold tracking-[-1.5px] leading-[1.1] mb-4 text-background"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Your next cycle starts here.
            </h2>
            <p className="text-background/60 max-w-[440px] mx-auto mb-8">
              Set up your org structure, configure your first cycle, and run appraisals that matter.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-background text-foreground font-medium px-6 py-3 rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Get started free <ArrowRight size={16} />
            </Link>
          </SectionReveal>
        </Section>
      </div>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-[rgba(0,0,0,0.1)]">
        <Section>
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div>
              <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                SIA
              </span>
              <p className="text-sm text-foreground/50 mt-2 leading-relaxed">
                Performance appraisal software for structured organizations.
              </p>
            </div>
            {FOOTER_COLS.map((col) => (
              <div key={col.heading}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/40 mb-3">{col.heading}</h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                        onClick={(e) => {
                          if (link.href.startsWith("#")) {
                            e.preventDefault();
                            document.querySelector(link.href)?.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[rgba(0,0,0,0.1)]">
            <span className="text-xs text-foreground/40">&copy; {new Date().getFullYear()} SIA. All rights reserved.</span>
            <span className="text-xs text-foreground/40">Built in the Caribbean 🌴</span>
          </div>
        </Section>
      </footer>
    </div>
  );
};

export default Index;
