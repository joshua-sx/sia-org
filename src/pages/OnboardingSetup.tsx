import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PageHead } from "@/components/PageHead";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingStepFrame } from "@/components/onboarding/OnboardingStepFrame";

export const INDUSTRIES = ["Government", "Aviation", "Healthcare", "Education", "Finance", "Hospitality", "Other"];
const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "India", "Japan", "Brazil", "South Africa", "Nigeria", "Kenya", "UAE",
  "Saudi Arabia", "Singapore", "Malaysia", "Philippines", "Indonesia", "Other",
];

interface SetupForm {
  first_name: string;
  last_name: string;
  org_name: string;
  country: string;
  industry: string;
}

/** Step 1 of onboarding. Creates the organization and the administrator profile. */
export default function OnboardingSetup() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SetupForm>({
    first_name: "",
    last_name: "",
    org_name: "",
    country: "",
    industry: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SetupForm, string>>>({});

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (profile) { navigate("/org/structure", { replace: true }); return; }
    const name = (user.user_metadata?.full_name || user.user_metadata?.name || "") as string;
    if (name) {
      const parts = name.trim().split(/\s+/);
      setForm((f) => ({
        ...f,
        first_name: f.first_name || parts[0] || "",
        last_name: f.last_name || parts.slice(1).join(" "),
      }));
    }
  }, [user, profile, loading, navigate]);

  const validate = () => {
    const errs: Partial<Record<keyof SetupForm, string>> = {};
    if (!form.first_name.trim()) errs.first_name = "Enter your first name";
    if (!form.last_name.trim()) errs.last_name = "Enter your last name";
    if (!form.org_name.trim()) errs.org_name = "Enter your organization name";
    if (!form.country) errs.country = "Select a country";
    if (!form.industry) errs.industry = "Select an industry";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    // The backend still stores a single `full_name`; join at the API boundary.
    const payload = {
      full_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
      org_name: form.org_name.trim(),
      country: form.country,
      industry: form.industry,
    };
    const { data, error } = await supabase.functions.invoke("complete-signup", { body: payload });
    setSubmitting(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Could not save your workspace");
      return;
    }
    await supabase.auth.refreshSession();
    window.location.href = "/org/structure";
  };

  const field = (key: keyof SetupForm) => ({
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
    className: errors[key] ? "border-destructive" : "",
  });

  const ErrorText = ({ name }: { name: keyof SetupForm }) =>
    errors[name] ? (
      <p id={`${name}-error`} className="text-xs text-destructive">
        {errors[name]}
      </p>
    ) : null;

  return (
    <>
      <PageHead title="Set up workspace | SIA" description="Create your SIA workspace." path="/onboarding/setup" noIndex />
      <OnboardingStepFrame
        stepKey="account"
        title="Set up your workspace"
        subtitle="You'll be the workspace administrator. Add a few details to get started."
        primaryLabel="Continue"
        onPrimary={submit}
        loading={submitting}
        loadingLabel="Saving…"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); void submit(); }}
          className="rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                placeholder="Joshua"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                {...field("first_name")}
              />
              <ErrorText name="first_name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                placeholder="Bowers"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                {...field("last_name")}
              />
              <ErrorText name="last_name" />
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <Label htmlFor="org_name">Organization name</Label>
            <Input
              id="org_name"
              placeholder="Acme Corp"
              value={form.org_name}
              onChange={(e) => setForm((f) => ({ ...f, org_name: e.target.value }))}
              {...field("org_name")}
            />
            <ErrorText name="org_name" />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}>
                <SelectTrigger id="country" {...field("country")}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <ErrorText name="country" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Select value={form.industry} onValueChange={(v) => setForm((f) => ({ ...f, industry: v }))}>
                <SelectTrigger id="industry" {...field("industry")}>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
              <ErrorText name="industry" />
            </div>
          </div>
        </form>
      </OnboardingStepFrame>
    </>
  );
}
