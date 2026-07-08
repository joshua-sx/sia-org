import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { AuthShell } from "@/components/AuthShell";
import { PageHead } from "@/components/PageHead";
import { Separator } from "@/components/ui/separator";

const INDUSTRIES = ["Government", "Aviation", "Healthcare", "Education", "Finance", "Hospitality", "Other"];
const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "India", "Japan", "Brazil", "South Africa", "Nigeria", "Kenya", "UAE",
  "Saudi Arabia", "Singapore", "Malaysia", "Philippines", "Indonesia", "Other",
];

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    org_name: "",
    country: "",
    industry: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    if (!form.password || form.password.length < 6) errs.password = "Password must be at least 6 characters";
    if (form.password !== form.confirm_password) errs.confirm_password = "Passwords do not match";
    if (!form.org_name.trim()) errs.org_name = "Organization name is required";
    if (!form.country) errs.country = "Country is required";
    if (!form.industry) errs.industry = "Industry is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("signup", {
        body: {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          org_name: form.org_name,
          country: form.country,
          industry: form.industry,
        },
      });

      if (error) {
        let message = error.message || "Signup failed";
        let details: Record<string, string> | undefined;
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === "function") {
          try {
            const body = await ctx.json();
            if (body?.error) message = body.error;
            if (body?.details) details = body.details;
          } catch {
            // ignore parse errors
          }
        }
        if (/already been registered|already registered|already exists/i.test(message)) {
          toast.error("An account with this email already exists.", {
            action: { label: "Log in", onClick: () => navigate("/login") },
          });
        } else {
          toast.error(message);
        }
        if (details) setErrors(details);
        setLoading(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        if (data.details) setErrors(data.details);
        setLoading(false);
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        toast.error("Account created but sign-in failed. Please log in manually.");
        navigate("/login");
      } else {
        toast.success("Welcome to SIA!");
        navigate("/dashboard");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (name: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        value={form[name]}
        onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
        className={errors[name] ? "border-destructive" : ""}
      />
      {errors[name] && <p className="text-xs text-destructive">{errors[name]}</p>}
    </div>
  );

  return (
    <>
      <PageHead
        title="Sign up | SIA"
        description="Create your SIA workspace and start running appraisal cycles for your organization in minutes."
        path="/signup"
      />
    <AuthShell
      title="Create your account"
      description="Set up your organization and start managing appraisals"
      size="lg"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {field("full_name", "Full name", "text", "Jane Doe")}
        {field("email", "Work email", "email", "jane@company.com")}
        <div className="grid grid-cols-2 gap-4">
          {field("password", "Password", "password")}
          {field("confirm_password", "Confirm password", "password")}
        </div>
        {field("org_name", "Organization name", "text", "Acme Corp")}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}>
              <SelectTrigger className={errors.country ? "border-destructive" : ""}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Industry</Label>
            <Select value={form.industry} onValueChange={(v) => setForm((f) => ({ ...f, industry: v }))}>
              <SelectTrigger className={errors.industry ? "border-destructive" : ""}>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.industry && <p className="text-xs text-destructive">{errors.industry}</p>}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-[hsl(var(--ink-subtle))]">OR</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={async () => {
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: window.location.origin,
          });
          if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
        }}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </Button>
    </AuthShell>
    </>
  );
};

export default Signup;
