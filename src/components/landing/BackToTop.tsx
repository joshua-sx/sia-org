import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";

export function BackToTop() {
  const reduceMotion = usePrefersReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (reduceMotion) {
    return show ? (
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:opacity-80 active:scale-[0.96] transition-[opacity,scale]"
        aria-label="Back to top"
      >
        <ArrowUp size={18} />
      </button>
    ) : null;
  }

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
