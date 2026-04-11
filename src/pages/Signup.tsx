import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
        toast.error(error.message || "Signup failed");
        setLoading(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        if (data.details) setErrors(data.details);
        setLoading(false);
        return;
      }

      // Sign in after successful signup
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link to="/" className="mb-2 inline-block text-xl font-bold tracking-tight font-[Space_Grotesk]">
            SIA
          </Link>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>Set up your organization and start managing appraisals</CardDescription>
        </CardHeader>
        <CardContent>
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

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
