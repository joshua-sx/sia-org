import {
  Target,
  ClipboardCheck,
  BarChart3,
  Building2,
  Plane,
  Heart,
  GraduationCap,
  Network,
} from "lucide-react";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const COLORS = {
  blue: "#4285F4",
  red: "#EA4335",
  purple: "#893EE0",
  green: "#34A853",
} as const;

export const GROTESK = "'Space Grotesk', system-ui, sans-serif";

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: EASE },
  }),
};

export const NAV_LINKS = [
  { label: "Why Sia", href: "#why" },
  { label: "How it works", href: "#how" },
  { label: "Who it's for", href: "#who" },
];

/** Marketing claims. Keep aligned with PRODUCT.md “Shipped vs not”. */
export const FEATURES = [
  {
    icon: Target,
    color: COLORS.blue,
    label: "Goal Setting",
    title: "Weighted goals with real accountability.",
    desc: "Managers set weighted goals for every report each cycle. Weights must total 100% before a stage can be scored.",
    span: "md:col-span-2",
  },
  {
    icon: ClipboardCheck,
    color: COLORS.red,
    label: "Structured Reviews",
    title: "A rating and a second perspective.",
    desc: "Managers rate each goal 1–5 at interim and final. An optional extra reviewer adds independent written comments.",
    span: "md:col-span-1",
  },
  {
    icon: BarChart3,
    color: COLORS.purple,
    label: "Progress & Records",
    title: "See the cycle move.",
    desc: "Live cycle progress for HR, plus exportable PDF appraisal records for the file.",
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

export const INDUSTRIES = [
  { icon: Building2, color: COLORS.blue, name: "Government", desc: "Ministries, departments, statutory bodies." },
  { icon: Plane, color: COLORS.red, name: "Aviation", desc: "Airlines, airport authorities, MROs." },
  { icon: Heart, color: COLORS.purple, name: "Healthcare", desc: "Hospitals, clinics, health authorities." },
  { icon: GraduationCap, color: COLORS.green, name: "Education", desc: "Universities, school boards, training institutes." },
];

export const STEPS = [
  { num: "1", color: COLORS.blue, title: "Structure your org", desc: "Units, people, reporting lines, and appraisal cycles." },
  { num: "2", color: COLORS.red, title: "Connect ChatGPT", desc: "OAuth + MCP — Sia exposes permission-aware org context." },
  { num: "3", color: COLORS.purple, title: "Ask anything", desc: "Goals, roles, reporting lines, and review status in plain language." },
  { num: "4", color: COLORS.green, title: "Run appraisals", desc: "Managers rate reports; employees acknowledge — the system of record." },
];

export type PricingPlan = {
  id: string;
  name: string;
  description: string;
  /** Price per employee per month. `null` means custom/contact sales. */
  monthlyPrice: number | null;
  yearlyPrice: number | null;
  ctaText: string;
  infoText: string;
  features: string[];
  isPopular?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Run your first appraisal cycle without spending a cent.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    ctaText: "Get started free",
    infoText: "No credit card required",
    features: ["1 active appraisal cycle", "Up to 25 employees", "Weighted goal setting & tracking", "Cycle progress dashboard"],
  },
  {
    id: "growth",
    name: "Growth",
    description: "Everything you need to run structured appraisals at scale.",
    monthlyPrice: 6,
    yearlyPrice: 4.8,
    ctaText: "Start free trial",
    infoText: "14-day free trial",
    features: [
      "Unlimited appraisal cycles",
      "Org structure builder",
      "Extra-reviewer comments on appraisals",
      "Interim & final scoring windows",
      "Cycle progress dashboard & PDF records",
      "CSV import / export",
    ],
    isPopular: true,
  },
  {
    id: "business",
    name: "Business",
    description: "For large or multi-entity organizations with complex hierarchies.",
    monthlyPrice: null,
    yearlyPrice: null,
    ctaText: "Contact sales",
    infoText: "Custom contract terms",
    features: [
      "Everything in Growth",
      "Role-based access control",
      "Dedicated onboarding support",
      "SSO & custom integrations (coming soon)",
      "Priority support",
    ],
  },
];

export type FooterLink = { label: string; href?: string };

export const FOOTER_COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#solution" },
      { label: "Reviews", href: "#how" },
      { label: "Goals", href: "#solution" },
      { label: "Analytics", href: "#solution" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "Government", href: "#who" },
      { label: "Aviation", href: "#who" },
      { label: "Healthcare", href: "#who" },
      { label: "Education", href: "#who" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Blog" },
      { label: "Help Center" },
      { label: "Templates" },
      { label: "Security" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#who" },
      { label: "Contact" },
      { label: "Privacy" },
      { label: "Terms" },
    ],
  },
];

export const cardBase = "bg-white border border-black/[0.08] rounded-xl";
