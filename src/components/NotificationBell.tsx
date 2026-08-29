import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { usePrefersReducedMotion } from "@/hooks/useReducedMotion";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead, isLoading } = useNotifications();

  const open = (n: AppNotification) => {
    if (!n.read_at) markRead([n.id]);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `Reminders, ${unreadCount} unread` : "Reminders"}
          className="relative flex h-7 w-7 items-center justify-center rounded-md text-ink-subtle transition-colors hover:bg-hairline/[0.5] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-4 w-4" />
          <AnimatePresence initial={false}>
            {unreadCount > 0 && (
              <motion.span
                key="unread-badge"
                initial={{
                  opacity: 0,
                  transform: prefersReducedMotion ? "none" : "scale(0.95)",
                }}
                animate={{
                  opacity: 1,
                  transform: prefersReducedMotion ? "none" : "scale(1)",
                }}
                exit={{
                  opacity: 0,
                  transform: prefersReducedMotion ? "none" : "scale(0.95)",
                  transition: { duration: 0.1, ease: [0.23, 1, 0.32, 1] },
                }}
                transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-semibold leading-none text-white tabular-nums"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-hairline px-3 py-2">
          <p className="text-xs font-semibold text-foreground">Reminders</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="px-3 py-6 text-center text-xs text-ink-subtle">Loading…</p>
        ) : notifications.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs font-medium text-foreground">You're all caught up</p>
            <p className="mt-1 text-[11px] text-ink-subtle">
              Reminders about late appraisal tasks show up here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-y divide-hairline">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n)}
                    className={`flex w-full gap-2 px-3 py-2.5 text-left transition-colors hover:bg-hairline/[0.35] ${
                      n.read_at ? "opacity-70" : ""
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        n.read_at ? "bg-transparent" : "bg-accent-red"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-foreground">{n.title}</span>
                      {n.body && (
                        <span className="mt-0.5 block text-[11px] text-ink-muted">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1 block text-[10px] uppercase tracking-wide text-ink-subtle">
                        {relativeTime(n.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
