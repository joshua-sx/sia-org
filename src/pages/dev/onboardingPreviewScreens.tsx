import { useState } from "react";
import { Check, Upload, Building2, UserCircle2, Users, CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepSuccess } from "@/components/onboarding/StepSuccess";
import type { PreviewFlowState, ValidationIssue } from "./onboardingPreviewFlow";

export interface PreviewFlowActions {
  checkEmployees: () => void;
  fixIssue: (issueId: string, managerName: string) => void;
  updateCycleField: (field: "cycleName" | "cycleStart" | "cycleEnd", value: string) => void;
  saveLaunchForm: () => void;
  goBack: () => void;
  goContinue: () => void;
  goToDashboard: () => void;
  skipStep: () => void;
  restart: () => void;
}

function PreviewDashboardMock({ state }: { state: PreviewFlowState }) {
  const checklist = [
    { key: "account", label: "Account", icon: UserCircle2, accent: "--accent-blue", done: true, skipped: false },
    { key: "structure", label: "Structure", icon: Building2, accent: "--accent-red", done: true, skipped: false },
    {
      key: "people",
      label: "People",
      icon: Users,
      accent: "--accent-purple",
      done: !state.peopleSkipped,
      skipped: state.peopleSkipped,
    },
    {
      key: "cycle",
      label: "Launch",
      icon: CalendarClock,
      accent: "--accent-green",
      done: !state.launchSkipped,
      skipped: state.launchSkipped,
    },
  ] as const;

  return (
    <div className="text-left">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--accent-blue))]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-blue))]" />
            Overview
          </p>
          <h1 className="text-[28px] font-semibold tracking-[-0.5px] text-foreground font-[Space_Grotesk] text-balance">
            Welcome back, Alex
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
            You&apos;re all set. Ready to run your first appraisal cycle.
          </p>
          <div className="mt-3 h-1 w-56 overflow-hidden rounded-full bg-[hsl(var(--ink-strong)/0.06)]">
            <div className="h-full w-full bg-[hsl(var(--accent-green))]" />
          </div>
        </div>

        <div className="min-w-[220px] rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <p className="text-[11px] uppercase tracking-wider text-[hsl(var(--ink-subtle))]">Organization</p>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">Ministry of Public Works</p>
        </div>
      </div>

      {!state.launchSkipped && (
        <div className="mt-8 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[hsl(var(--accent-green))]">
                Active cycle
              </p>
              <p className="mt-1 text-lg font-semibold font-[Space_Grotesk] text-foreground">
                {state.cycleName || "FY 2026 Annual Review"}
              </p>
              <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
                Draft · {state.peopleSkipped ? "0" : "84"} participants
                {state.cycleStart && state.cycleEnd ? ` · ${state.cycleStart} – ${state.cycleEnd}` : ""}
              </p>
            </div>
            <span className="rounded-full bg-[hsl(var(--accent-green)/0.12)] px-2.5 py-1 text-[11px] font-medium text-[hsl(var(--accent-green))]">
              Ready to launch
            </span>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))]">
        <div className="flex items-center justify-between border-b border-[hsl(var(--hairline))] px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Setup checklist</h2>
          <span className="inline-flex items-center rounded-full bg-[hsl(var(--accent-green)/0.12)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--accent-green))] tabular-nums">
            4/4
          </span>
        </div>
        <div className="divide-y divide-[hsl(var(--hairline))]">
          {checklist.map((item) => {
            const Icon = item.icon;
            const statusLabel = item.skipped ? "Skipped" : item.done ? "Complete" : "Not started";
            return (
              <div key={item.key} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `hsl(var(${item.accent}) / 0.1)` }}
                >
                  <Icon className="h-4 w-4" style={{ color: `hsl(var(${item.accent}))` }} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="ml-2 text-[11px] capitalize text-[hsl(var(--ink-subtle))]">
                    · {statusLabel}
                  </span>
                </div>
                {item.done ? (
                  <CheckCircle2 className="h-[18px] w-[18px] text-[hsl(var(--accent-green))]" />
                ) : (
                  <span className="text-[11px] text-[hsl(var(--ink-subtle))]">Skipped</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {children}
    </div>
  );
}

function LevelRow({ level, name, units }: { level: string; name: string; units: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[hsl(var(--surface))] px-3.5 py-3">
      <span className="w-8 text-xs font-semibold text-[hsl(var(--ink-subtle))]">{level}</span>
      <span className="flex-1 text-sm text-foreground">{name}</span>
      <span className="text-xs text-[hsl(var(--ink-subtle))]">{units}</span>
    </div>
  );
}

function FixIssueDialog({
  issue,
  open,
  onOpenChange,
  onSave,
}: {
  issue: ValidationIssue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (managerName: string) => void;
}) {
  const [manager, setManager] = useState("");

  const handleSave = () => {
    if (!manager) return;
    onSave(manager);
    setManager("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fix reporting line</DialogTitle>
        </DialogHeader>
        {issue && (
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium text-foreground">{issue.name}</p>
              <p className="text-xs text-[hsl(var(--ink-muted))] mt-0.5">{issue.issue}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Assign manager</Label>
              <Select value={manager} onValueChange={setManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sarah Mitchell">Sarah Mitchell</SelectItem>
                  <SelectItem value="David Clarke">David Clarke</SelectItem>
                  <SelectItem value="Priya Nand">Priya Nand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!manager}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ValidationRow({
  issue,
  onFix,
}: {
  issue: ValidationIssue;
  onFix: () => void;
}) {
  if (issue.fixed) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-[hsl(var(--accent-green)/0.25)] bg-[hsl(var(--accent-green)/0.06)] p-4">
        <Check className="h-4 w-4 shrink-0" strokeWidth={3} style={{ color: "hsl(var(--accent-green))" }} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{issue.name}</p>
          <p className="text-xs text-[hsl(var(--accent-green))]">Fixed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent-yellow)/0.15)] text-sm font-semibold text-[hsl(var(--accent-yellow))]">
        !
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{issue.name}</p>
        <p className="text-xs text-[hsl(var(--ink-muted))]">{issue.issue}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onFix}>
        Fix
      </Button>
    </div>
  );
}

export function PreviewScreenBody({
  state,
  actions,
}: {
  state: PreviewFlowState;
  actions: PreviewFlowActions;
}) {
  const [fixingIssue, setFixingIssue] = useState<ValidationIssue | null>(null);
  const openIssues = state.validationIssues.filter((i) => !i.fixed);
  const readyCount = 84 - openIssues.length;

  switch (state.screenId) {
    case "account":
      return (
        <TaskCard>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="preview-org">Organization name</Label>
              <Input id="preview-org" defaultValue="Ministry of Education" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="preview-industry">Industry</Label>
                <Input id="preview-industry" defaultValue="Government" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preview-country">Country</Label>
                <Input id="preview-country" defaultValue="Saint Lucia" />
              </div>
            </div>
          </div>
        </TaskCard>
      );

    case "structure":
      return (
        <TaskCard>
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-lg font-semibold font-[Space_Grotesk]">Organization levels</h2>
            <Button variant="outline" size="sm" type="button">
              Use template
            </Button>
          </div>
          <div className="space-y-2 mb-4">
            <LevelRow level="L1" name="Ministry" units="1 unit" />
            <LevelRow level="L2" name="Department" units="4 units" />
            <LevelRow level="L3" name="Division" units="7 units" />
          </div>
          <button type="button" className="text-sm font-medium text-[hsl(var(--accent-blue))]">
            + Add level
          </button>
        </TaskCard>
      );

    case "people-import":
      return (
        <TaskCard>
          <div className="flex items-center justify-between mb-5 text-xs text-[hsl(var(--ink-subtle))]">
            <div className="flex gap-4">
              <span className="font-medium text-[hsl(var(--accent-purple))]">1 Upload CSV</span>
              <span className={state.importChecked ? "font-medium text-[hsl(var(--accent-purple))]" : ""}>
                2 Fix issues
              </span>
            </div>
            <span>{state.importChecked ? "Check complete" : "Upload 1 of 2"}</span>
          </div>
          <div className="rounded-lg border border-dashed border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] p-5 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">employees-july.csv</p>
                <p className="text-xs text-[hsl(var(--ink-muted))] mt-0.5">
                  {state.importChecked ? "84 employees · checked" : "84 employees · ready to check"}
                </p>
              </div>
              <Button variant="outline" size="sm" type="button">
                Replace file
              </Button>
            </div>
          </div>
          {!state.importChecked ? (
            <Button className="w-full" type="button" onClick={actions.checkEmployees}>
              <Upload className="mr-2 h-4 w-4" />
              Check 84 employees
            </Button>
          ) : (
            <div className="rounded-lg bg-[hsl(var(--accent-green)/0.08)] border border-[hsl(var(--accent-green)/0.2)] p-3 text-sm text-[hsl(var(--accent-green))] flex items-center gap-2">
              <Check className="h-4 w-4" strokeWidth={3} />
              Import checked — 2 issues found. Continue to validation.
            </div>
          )}
          <button type="button" className="mt-4 block w-full text-center text-sm text-[hsl(var(--accent-blue))]">
            Or add employees manually
          </button>
        </TaskCard>
      );

    case "people-validation":
      return (
        <>
          <div className="space-y-3">
            {state.validationIssues.map((issue) => (
              <ValidationRow
                key={issue.id}
                issue={issue}
                onFix={() => setFixingIssue(issue)}
              />
            ))}
            <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-[hsl(var(--ink-muted))]">Ready</span>
                <span className="font-medium tabular-nums">{readyCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[hsl(var(--ink-muted))]">Needs attention</span>
                <span
                  className={
                    "font-medium tabular-nums " +
                    (openIssues.length > 0 ? "text-[hsl(var(--accent-yellow))]" : "text-[hsl(var(--accent-green))]")
                  }
                >
                  {openIssues.length}
                </span>
              </div>
            </div>
          </div>
          <FixIssueDialog
            issue={fixingIssue}
            open={!!fixingIssue}
            onOpenChange={(open) => !open && setFixingIssue(null)}
            onSave={(manager) => {
              if (fixingIssue) actions.fixIssue(fixingIssue.id, manager);
            }}
          />
        </>
      );

    case "launch-setup":
      return (
        <TaskCard>
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="preview-cycle">Cycle name</Label>
              <Input
                id="preview-cycle"
                value={state.cycleName}
                onChange={(e) => actions.updateCycleField("cycleName", e.target.value)}
                placeholder="FY 2026 Annual Review"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="preview-start">Self-review opens</Label>
                <Input
                  id="preview-start"
                  type="date"
                  value={state.cycleStart}
                  onChange={(e) => actions.updateCycleField("cycleStart", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preview-end">Manager review due</Label>
                <Input
                  id="preview-end"
                  type="date"
                  value={state.cycleEnd}
                  onChange={(e) => actions.updateCycleField("cycleEnd", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Scoring scale</Label>
              <Input defaultValue="1–5 (Meets expectations)" readOnly />
            </div>
            <Button
              type="button"
              onClick={actions.saveLaunchForm}
              disabled={!state.cycleName.trim() || !state.cycleStart || !state.cycleEnd}
            >
              Save cycle details
            </Button>
            {state.launchFormSaved && (
              <p className="text-xs text-[hsl(var(--accent-green))] flex items-center gap-1">
                <Check className="h-3 w-3" strokeWidth={3} />
                Cycle details saved
              </p>
            )}
          </div>
        </TaskCard>
      );

    case "launch-review":
      return (
        <div className="space-y-3">
          {[
            "Organization structure is complete",
            state.peopleSkipped ? "People step skipped" : "84 employees imported with managers",
            state.launchSkipped ? "Launch configured with defaults" : `${state.cycleName || "Cycle"} configured`,
          ].map((label) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-4"
            >
              <Check className="h-4 w-4 shrink-0" strokeWidth={3} style={{ color: "hsl(var(--accent-green))" }} />
              <span className="text-sm text-foreground">{label}</span>
            </div>
          ))}
          <div className="rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--ink-subtle))]">
              Cycle summary
            </p>
            <p className="mt-2 text-lg font-semibold font-[Space_Grotesk]">
              {state.cycleName || "FY 2026 Annual Review"}
            </p>
            <p className="mt-1 text-sm text-[hsl(var(--ink-muted))]">
              84 participants
              {state.cycleStart && state.cycleEnd
                ? ` · ${state.cycleStart} – ${state.cycleEnd}`
                : ""}
            </p>
          </div>
        </div>
      );

    case "complete":
      return (
        <StepSuccess
          eyebrow="Setup complete"
          title="You're ready to launch"
          description="Your organization, people, and first cycle are configured. Nothing has been sent yet."
          stats={[
            { value: 3, label: "Levels" },
            { value: state.peopleSkipped ? 0 : 84, label: "People" },
            { value: state.launchSkipped ? 0 : 1, label: "Cycle" },
          ]}
          primaryLabel="Go to dashboard"
          onPrimary={actions.goToDashboard}
          secondaryLabel="Start over"
          onSecondary={actions.restart}
        />
      );

    case "dashboard":
      return <PreviewDashboardMock state={state} />;

    default: {
      const _exhaustive: never = state.screenId;
      return _exhaustive;
    }
  }
}

export { SCREEN_ORDER, SCREEN_LABELS } from "./onboardingPreviewFlow";
export type { PreviewScreenId } from "./onboardingPreviewFlow";
