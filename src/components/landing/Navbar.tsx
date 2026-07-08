import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";
import { COLORS, NAV_LINKS } from "./constants";

export function Navbar() {
  const reduceMotion = usePrefersReducedMotion();
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

  const mobileNav = (
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
  );

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
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="landing-mobile-nav"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
      {reduceMotion ? (
        mobileOpen && (
          <div id="landing-mobile-nav" className="md:hidden bg-white border-b border-black/[0.08] overflow-hidden">
            {mobileNav}
          </div>
        )
      ) : (
        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              id="landing-mobile-nav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-black/[0.08] overflow-hidden"
            >
              {mobileNav}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </header>
  );
}
