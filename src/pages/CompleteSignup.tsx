import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { PageHead } from "@/components/PageHead";
import { useAuth } from "@/contexts/AuthContext";

const INDUSTRIES = ["Government", "Aviation", "Healthcare", "Education", "Finance", "Hospitality", "Other"];
const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "India", "Japan", "Brazil", "South Africa", "Nigeria", "Kenya", "UAE",
  "Saudi Arabia", "Singapore", "Malaysia", "Philippines", "Indonesia", "Other",
];

export default function CompleteSignup() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    org_name: "",
    country: "",
    industry: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    if (profile) { navigate("/dashboard", { replace: true }); return; }
    const name = (user.user_metadata?.full_name || user.user_metadata?.name || "") as string;
    if (name) setForm((f) => ({ ...f, full_name: name }));
  }, [user, profile, loading, navigate]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required";
    if (!form.org_name.trim()) errs.org_name = "Organization name is required";
    if (!form.country) errs.country = "Country is required";
    if (!form.industry) errs.industry = "Industry is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("complete-signup", { body: form });
    setSubmitting(false);
    if (error || data?.error) {
      const msg = data?.error || error?.message || "Failed to complete signup";
      toast.error(msg);
      if (data?.details) setErrors(data.details);
      return;
    }
    await supabase.auth.refreshSession();
    toast.success("Welcome to SIA!");
    window.location.href = "/dashboard";
  };

  return (
    <>
      <PageHead title="Complete signup | SIA" description="Finish setting up your SIA workspace." path="/complete-signup" />
      <AuthShell
        title="Set up your workspace"
        description="A few details to finish creating your organization"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className={errors.full_name ? "border-destructive" : ""} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org_name">Organization name</Label>
            <Input id="org_name" placeholder="Acme Corp" value={form.org_name} onChange={(e) => setForm((f) => ({ ...f, org_name: e.target.value }))} className={errors.org_name ? "border-destructive" : ""} />
            {errors.org_name && <p className="text-xs text-destructive">{errors.org_name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}>
                <SelectTrigger className={errors.country ? "border-destructive" : ""}><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={(v) => setForm((f) => ({ ...f, industry: v }))}>
                <SelectTrigger className={errors.industry ? "border-destructive" : ""}><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
              {errors.industry && <p className="text-xs text-destructive">{errors.industry}</p>}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Creating workspace..." : "Continue"}
          </Button>
        </form>
      </AuthShell>
    </>
  );
}
