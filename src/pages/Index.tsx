import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  useInView,
  useScroll,
  useTransform,
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
  ChevronDown,
  Check,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────── DATA ─────────────────────────── */

const NAV_ITEMS = [
  { id: "ni-1", label: "Features", href: "#solution", hasDropdown: true },
  { id: "ni-2", label: "Who It's For", href: "#who", hasDropdown: false },
  { id: "ni-3", label: "How It Works", href: "#how", hasDropdown: false },
  { id: "ni-4", label: "Pricing", href: "#pricing", hasDropdown: false },
] as const;

const FEATURES_DROPDOWN = [
  { id: "fd-1", label: "Goal Setting", desc: "Set & track measurable goals" },
  { id: "fd-2", label: "Mid-Year Reviews", desc: "Structured mid-cycle check-ins" },
  { id: "fd-3", label: "End-of-Year Reviews", desc: "Digital ratings & sign-offs" },
  { id: "fd-4", label: "HR Dashboard", desc: "Real-time org-wide progress" },
  { id: "fd-5", label: "PDF Export", desc: "Completed appraisals, archived" },
  { id: "fd-6", label: "Role-Based Access", desc: "Right data for the right people" },
] as const;

const PROBLEM_ITEMS = [
  {
    id: "problem-1",
    num: "01",
    title: "Hours wasted every cycle",
    description:
      "Distributing forms, chasing signatures, manually calculating scores. Your HR team spends weeks on admin work that should take days.",
  },
  {
    id: "problem-2",
    num: "02",
    title: "No audit trail",
    description:
      "Paper forms get lost. Spreadsheets get overwritten. When a dispute arises, there's nothing to point to.",
  },
  {
    id: "problem-3",
    num: "03",
    title: "Employees feel left in the dark",
    description:
      "Without a clear system, appraisals feel arbitrary. People don't know where they stand or what's expected of them.",
  },
] as const;

const SOLUTION_ITEMS = [
  {
    id: "sol-1",
    Icon: Target,
    title: "Goal Setting",
    description:
      "Managers set measurable goals for each employee at the start of the cycle. Employees review and acknowledge. Everyone starts on the same page.",
  },
  {
    id: "sol-2",
    Icon: ClipboardCheck,
    title: "Mid-Year & End-of-Year Reviews",
    description:
      "Structured rating phases with written assessments, scores, and digital acknowledgments. No forms. No printing. No scanning.",
  },
  {
    id: "sol-3",
    Icon: BarChart3,
    title: "HR Dashboard",
    description:
      "See exactly where every appraisal stands across your entire organization — by division, by department, by manager. Spot bottlenecks before they become problems.",
  },
] as const;

const WHO_ITEMS = [
  {
    id: "who-1",
    Icon: Building2,
    title: "Government Agencies",
    description: "Structured, compliant, and fully auditable appraisal workflows.",
  },
  {
    id: "who-2",
    Icon: Plane,
    title: "Aviation & Transport",
    description: "Multi-department orgs with complex reporting lines handled with ease.",
  },
  {
    id: "who-3",
    Icon: Heart,
    title: "Healthcare",
    description: "Role-based access so the right people see only the right data.",
  },
  {
    id: "who-4",
    Icon: GraduationCap,
    title: "Education",
    description: "Faculty and staff appraisals managed together in one place.",
  },
] as const;

const HOW_STEPS = [
  {
    id: "step-1",
    step: "01",
    title: "Create your organization",
    description: "Sign up, enter your org name, add your structure — divisions, departments, teams.",
  },
  {
    id: "step-2",
    step: "02",
    title: "Add your people",
    description: "Import employees, assign roles, connect managers to their direct reports.",
  },
  {
    id: "step-3",
    step: "03",
    title: "Launch a cycle",
    description:
      "Create an appraisal cycle, set the dates, and SIA guides every role through what to do next.",
  },
  {
    id: "step-4",
    step: "04",
    title: "Track and complete",
    description:
      "Your HR dashboard shows real-time progress. Export completed appraisals as PDFs for your records.",
  },
] as const;

const PRICING_FEATURES = [
  "Unlimited appraisal cycles",
  "Goal setting & tracking",
  "Mid-year & end-of-year reviews",
  "HR dashboard & analytics",
  "PDF export of completed appraisals",
  "Role-based access control",
  "Multi-division support",
  "Email notifications",
];

const TRUST_STATS = [
  { id: "ts-1", value: "100+", label: "Employees managed" },
  { id: "ts-2", value: "3×", label: "Faster cycle close" },
  { id: "ts-3", value: "0", label: "Paper forms needed" },
] as const;

const FOOTER_COLS = [
  {
    id: "fc-1",
    heading: "Product",
    links: [
      { id: "f-1", label: "Features", href: "#solution" },
      { id: "f-2", label: "How It Works", href: "#how" },
      { id: "f-3", label: "Pricing", href: "#pricing" },
    ],
  },
  {
    id: "fc-2",
    heading: "Company",
    links: [
      { id: "f-4", label: "About", href: "#" },
      { id: "f-5", label: "Contact", href: "#" },
      { id: "f-6", label: "Blog", href: "#" },
    ],
  },
  {
    id: "fc-3",
    heading: "Legal",
    links: [
      { id: "f-7", label: "Privacy", href: "#" },
      { id: "f-8", label: "Terms", href: "#" },
    ],
  },
] as const;

/* ─────────────────────── ANIMATION HELPERS ──────────────────── */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: EASE },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─────────────────────── SUB-COMPONENTS ──────────────────── */

const AnimatedSection = ({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
};

const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 28 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-primary origin-left z-[60]"
    />
  );
};

const BackToTop = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer border-none shadow-sm rounded-full"
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

/* ── Dashboard Mockup ── */
const DashboardMockup = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const APPRAISAL_ROWS = [
    { id: "ar-1", name: "Alicia Hargreaves", dept: "Operations", score: "4.2", badge: "bg-emerald-50 text-emerald-700 border-emerald-100", status: "Complete" },
    { id: "ar-2", name: "Marcus Chen", dept: "Engineering", score: "3.8", badge: "bg-blue-50 text-blue-700 border-blue-100", status: "In Review" },
    { id: "ar-3", name: "Sandra Bowen", dept: "HR", score: "—", badge: "bg-amber-50 text-amber-700 border-amber-100", status: "Pending" },
    { id: "ar-4", name: "David Reyes", dept: "Finance", score: "4.7", badge: "bg-emerald-50 text-emerald-700 border-emerald-100", status: "Complete" },
  ] as const;

  const STAT_CARDS = [
    { id: "sc-1", label: "Completed", value: "24", total: "31", pct: 77, color: "bg-foreground" },
    { id: "sc-2", label: "In Review", value: "5", total: "31", pct: 16, color: "bg-muted-foreground" },
    { id: "sc-3", label: "Pending", value: "2", total: "31", pct: 7, color: "bg-muted" },
  ] as const;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE as unknown as number[] }}
      className="w-full max-w-4xl mx-auto mt-16"
    >
      {/* Title bar */}
      <div className="bg-card border border-border rounded-t-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">SIA Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 rounded bg-muted" />
            <div className="w-8 h-2 rounded bg-muted" />
          </div>
        </div>

        <div className="p-6">
          {/* Stat row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {STAT_CARDS.map((s, idx) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
                className="p-4 rounded-lg border border-border bg-background"
              >
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className="text-2xl font-semibold font-[Space_Grotesk]">{s.value}</p>
                <div className="w-full h-1.5 rounded-full bg-muted mt-2">
                  <div className={cn("h-full rounded-full", s.color)} style={{ width: `${s.pct}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {s.value} of {s.total} employees
                </p>
              </motion.div>
            ))}
          </div>

          {/* Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-medium">Appraisal Progress</p>
              <div className="w-20 h-2 rounded bg-muted" />
            </div>
            <div className="divide-y divide-border">
              {APPRAISAL_ROWS.map((row, idx) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.5 + idx * 0.08 }}
                  className="flex items-center gap-4 px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    {row.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{row.name}</p>
                    <p className="text-xs text-muted-foreground">{row.dept}</p>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                    {row.score}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border", row.badge)}>
                    {row.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─────────────────────── NAVBAR ──────────────────── */

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFeaturesOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const scrollTo = (href: string) => {
    setIsMobileMenuOpen(false);
    setFeaturesOpen(false);
    const el = document.getElementById(href.replace("#", ""));
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-foreground text-background flex items-center justify-center text-sm font-bold rounded-lg">
            S
          </div>
          <span className="text-lg font-bold tracking-tight font-[Space_Grotesk]">SIA</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {/* Features dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setFeaturesOpen((v) => !v)}
              className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              Features
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", featuresOpen && "rotate-180")} />
            </button>
            <AnimatePresence>
              {featuresOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
                >
                  {FEATURES_DROPDOWN.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo("#solution")}
                      className="w-full text-left flex flex-col px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {NAV_ITEMS.filter((item) => !item.hasDropdown).map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.href)}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity no-underline"
          >
            Get started
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          type="button"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          className="md:hidden p-2 bg-transparent border-none cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.href)}
                  className="block w-full text-left py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg no-underline"
                >
                  Get started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

/* ─────────────────────── MAIN PAGE ──────────────────── */

const Index = () => {
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], [0, 48]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground font-['DM_Sans']">
      <ScrollProgressBar />
      <Navbar />
      <BackToTop />

      {/* ══════════════ HERO ══════════════ */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Dot-grid background */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.button
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("solution")?.scrollIntoView({ behavior: "smooth" });
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE as unknown as number[] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-border text-xs font-medium text-muted-foreground mb-8 hover:border-muted-foreground transition-colors bg-card/80 rounded-full cursor-pointer"
          >
            Performance appraisals, built for modern organizations
            <span>→</span>
          </motion.button>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE as unknown as number[] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] font-[Space_Grotesk]"
          >
            Performance Appraisals
            <br />
            <span className="text-primary">that actually work.</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE as unknown as number[] }}
            className="mt-6 max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed"
          >
            SIA gives HR teams, managers, and employees one place to set goals, track progress, and
            complete appraisals — without the paperwork, the follow-up emails, or the spreadsheets.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: EASE as unknown as number[] }}
            className="mt-10"
          >
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity no-underline"
            >
              Start your free trial
            </Link>
            <p className="mt-3 text-xs text-muted-foreground">
              14-day free trial · No credit card required
            </p>
          </motion.div>
        </motion.div>

        <DashboardMockup />
      </section>

      {/* ══════════════ PROBLEM ══════════════ */}
      <AnimatedSection id="problem" className="py-24 md:py-32 bg-foreground text-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-xs font-medium tracking-widest uppercase opacity-60 mb-4">
              The Problem
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold font-[Space_Grotesk] leading-tight">
              Most organizations still run appraisals on paper.{" "}
              <span className="opacity-50">Or worse — Excel.</span>
            </motion.h2>
          </div>
          <div className="space-y-12">
            {PROBLEM_ITEMS.map((item, i) => (
              <motion.div key={item.id} variants={fadeUp} custom={i + 2} className="flex gap-6">
                <span className="text-sm font-medium opacity-30 font-[Space_Grotesk] pt-1">{item.num}</span>
                <div>
                  <h3 className="text-lg font-semibold mb-2 font-[Space_Grotesk]">{item.title}</h3>
                  <p className="opacity-60 leading-relaxed max-w-lg">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════ SOLUTION ══════════════ */}
      <AnimatedSection id="solution" className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-6">
            <motion.p variants={fadeUp} custom={0} className="text-xs font-medium tracking-widest uppercase text-primary mb-4">
              The Solution
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold font-[Space_Grotesk] leading-tight">
              One system. Every phase. Every role.
            </motion.h2>
          </div>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mb-16 leading-relaxed">
            SIA walks your organization through the full appraisal cycle — from goal setting to final
            rating — with clear accountability at every step.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-8">
            {SOLUTION_ITEMS.map((item, i) => (
              <motion.div
                key={item.id}
                variants={fadeUp}
                custom={i + 3}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <item.Icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2 font-[Space_Grotesk]">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════ WHO IT'S FOR ══════════════ */}
      <AnimatedSection id="who" className="py-24 md:py-32 bg-muted/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-6">
            <motion.p variants={fadeUp} custom={0} className="text-xs font-medium tracking-widest uppercase text-primary mb-4">
              Who It's For
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold font-[Space_Grotesk] leading-tight">
              Built for organizations that take <span className="text-primary">performance</span> seriously.
            </motion.h2>
          </div>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mb-16 leading-relaxed">
            Whether you manage 50 people or 5,000, SIA adapts to your org structure.
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHO_ITEMS.map((item, i) => (
              <motion.div
                key={item.id}
                variants={fadeUp}
                custom={i + 3}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <item.Icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1 font-[Space_Grotesk]">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
          <motion.p variants={fadeUp} custom={7} className="text-center text-sm text-muted-foreground mt-12">
            If your organization has people, SIA is built for you.
          </motion.p>
        </div>
      </AnimatedSection>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <AnimatedSection id="how" className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-6">
            <motion.p variants={fadeUp} custom={0} className="text-xs font-medium tracking-widest uppercase text-primary mb-4">
              How It Works
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold font-[Space_Grotesk] leading-tight">
              Up and running in an afternoon.
            </motion.h2>
          </div>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mb-16 leading-relaxed">
            No IT team required. No month-long implementations. Just a clear, guided setup.
          </motion.p>
          <div className="space-y-0">
            {HOW_STEPS.map((step, i) => (
              <motion.div key={step.id} variants={fadeUp} custom={i + 3} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold font-[Space_Grotesk] shrink-0">
                    {step.step}
                  </div>
                  {i < HOW_STEPS.length - 1 && (
                    <div className="w-px h-16 bg-border my-2" />
                  )}
                </div>
                <div className="pb-12">
                  <h3 className="text-lg font-semibold font-[Space_Grotesk]">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed max-w-md">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════ TRUST / CREDIBILITY ══════════════ */}
      <AnimatedSection className="py-24 md:py-32 bg-muted/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Left */}
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-xs font-medium tracking-widest uppercase text-primary mb-4">
                Why SIA
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold font-[Space_Grotesk] leading-tight mb-6">
                Designed with real HR teams,{" "}
                <span className="text-primary">for real organizations.</span>
              </motion.h2>
              <motion.div variants={fadeUp} custom={2} className="space-y-4 text-muted-foreground leading-relaxed mb-8">
                <p>
                  SIA was built from the ground up after working directly with HR directors, managers,
                  and employees at one of the Caribbean's busiest international airports. Every feature
                  exists because a real HR professional needed it.
                </p>
                <p>
                  No bloat. No features you'll never use. Just the appraisal system your organization
                  actually needs.
                </p>
              </motion.div>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                {["Built in the Caribbean", "Used in production", "HR-driven design"].map((label) => (
                  <div key={label} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Stats */}
            <div className="grid gap-6">
              {TRUST_STATS.map((stat, i) => (
                <motion.div key={stat.id} variants={fadeUp} custom={i + 4} className="text-center p-6 rounded-xl border border-border bg-card">
                  <p className="text-4xl font-bold font-[Space_Grotesk]">{stat.value}</p>
                  <div className="w-12 h-px bg-border mx-auto my-3" />
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════ PRICING ══════════════ */}
      <AnimatedSection id="pricing" className="py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="max-w-2xl mb-6">
            <motion.p variants={fadeUp} custom={0} className="text-xs font-medium tracking-widest uppercase text-primary mb-4">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold font-[Space_Grotesk] leading-tight">
              Simple, transparent pricing.
            </motion.h2>
          </div>
          <motion.p variants={fadeUp} custom={2} className="text-muted-foreground max-w-xl mb-16 leading-relaxed">
            One plan. Everything included. Pay based on your organization size.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="max-w-lg mx-auto border border-border rounded-xl bg-card overflow-hidden">
            {/* Card header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold font-[Space_Grotesk]">SIA for Teams</h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-medium">
                  All-in-one
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Everything you need for structured appraisals</p>
            </div>

            {/* Features list */}
            <div className="p-6 space-y-3">
              {PRICING_FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-accent-foreground" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="p-6 border-t border-border">
              <Link
                to="/signup"
                className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity no-underline"
              >
                Start your free trial
              </Link>
              <p className="text-center text-xs text-muted-foreground mt-3">
                14-day free trial · No credit card required · Set up in minutes
              </p>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className="py-24 md:py-32 bg-foreground text-background">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold font-[Space_Grotesk] leading-tight">
            Your next appraisal cycle{" "}
            <span className="text-primary">starts here.</span>
          </h2>
          <p className="mt-6 opacity-60 max-w-lg mx-auto leading-relaxed">
            Join organizations already using SIA to run structured, paperless performance reviews.
          </p>
          <div className="mt-10">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-background text-foreground rounded-lg hover:opacity-90 transition-opacity no-underline"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs opacity-40">No credit card required. Set up in minutes.</p>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 no-underline mb-4">
                <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center text-xs font-bold rounded-md">
                  S
                </div>
                <span className="text-base font-bold tracking-tight font-[Space_Grotesk]">SIA</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Performance appraisals, built for modern organizations.
              </p>
            </div>

            {FOOTER_COLS.map((col) => (
              <div key={col.id}>
                <h4 className="text-sm font-semibold mb-4">{col.heading}</h4>
                <ul className="space-y-2 list-none p-0">
                  {col.links.map((link) => (
                    <li key={link.id}>
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors no-underline"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SIA. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">Built in the Caribbean</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
