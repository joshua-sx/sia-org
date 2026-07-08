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
  yellow: "#FBBC05",
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
  { label: "Features", href: "#solution" },
  { label: "Who It\u2019s For", href: "#who" },
  { label: "How It Works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
];

export const FEATURES = [
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

export const INDUSTRIES = [
  { icon: Building2, color: COLORS.blue, name: "Government", desc: "Ministries, departments, statutory bodies." },
  { icon: Plane, color: COLORS.red, name: "Aviation", desc: "Airlines, airport authorities, MROs." },
  { icon: Heart, color: COLORS.yellow, name: "Healthcare", desc: "Hospitals, clinics, health authorities." },
  { icon: GraduationCap, color: COLORS.green, name: "Education", desc: "Universities, school boards, training institutes." },
];

export const STEPS = [
  { num: "1", color: COLORS.blue, title: "Define your structure", desc: "Set up your org hierarchy — ministries, divisions, units." },
  { num: "2", color: COLORS.red, title: "Configure cycles", desc: "Choose review type, frequency, and participants." },
  { num: "3", color: COLORS.yellow, title: "Run appraisals", desc: "Employees and managers complete reviews in-app." },
  { num: "4", color: COLORS.green, title: "Review & act", desc: "Analyze results, export reports, plan next steps." },
];

export const PRICING_FEATURES = [
  "Unlimited appraisal cycles",
  "Org structure builder",
  "360° review workflows",
  "Goal cascading & tracking",
  "Real-time analytics dashboard",
  "CSV import / export",
  "Role-based access control",
  "Dedicated onboarding support",
];

export const AI_QUICK_ACTIONS = [
  "Summarize this cycle",
  "Find overdue reviews",
  "Compare departments",
  "Draft feedback",
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
