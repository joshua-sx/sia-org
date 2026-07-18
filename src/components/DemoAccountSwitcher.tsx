import { useState } from "react";
import { UserCog, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEMO_ACCOUNTS = [
  { role: "HR Admin", email: "hr@sia.demo", password: "DemoHR2026!", accent: "--accent-blue" },
  { role: "Manager", email: "manager@sia.demo", password: "DemoMgr2026!", accent: "--accent-green" },
  { role: "Employee", email: "employee@sia.demo", password: "DemoEmp2026!", accent: "--accent-purple" },
] as const;

export function DemoAccountSwitcher() {
  const { user } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  const currentEmail = user?.email ?? null;
  // Show only when nobody's signed in, or a demo account is active.
  const isDemoContext = !currentEmail || currentEmail.endsWith("@sia.demo");
  if (!isDemoContext) return null;

  const switchTo = async (email: string, password: string) => {
    setBusy(email);
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success(`Signed in as ${email}`);
      window.location.assign("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to switch account");
      setBusy(null);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-full border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-3.5 py-2 text-xs font-medium text-foreground shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)] hover:bg-[hsl(var(--ink-strong)/0.04)] transition-colors"
            aria-label="Switch demo account"
          >
            <UserCog className="h-3.5 w-3.5 text-[hsl(var(--ink-muted))]" />
            <span>Demo accounts</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-72">
          <DropdownMenuLabel className="text-xs text-[hsl(var(--ink-muted))]">
            Sign in as
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {DEMO_ACCOUNTS.map((acc) => {
            const isCurrent = currentEmail === acc.email;
            const isBusy = busy === acc.email;
            return (
              <DropdownMenuItem
                key={acc.email}
                disabled={isCurrent || !!busy}
                onSelect={(e) => {
                  e.preventDefault();
                  if (!isCurrent) switchTo(acc.email, acc.password);
                }}
                className="flex items-start gap-2.5 py-2"
              >
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: `hsl(var(${acc.accent}))` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{acc.role}</span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase tracking-wide text-[hsl(var(--ink-subtle))]">
                        current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[hsl(var(--ink-muted))] truncate">{acc.email}</div>
                  <div className="text-[11px] text-[hsl(var(--ink-subtle))] font-mono">
                    {acc.password}
                  </div>
                </div>
                {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
