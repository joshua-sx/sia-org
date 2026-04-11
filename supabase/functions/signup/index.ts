import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { full_name, email, password, org_name, country, industry } = body;

    // Validate inputs
    const errors: Record<string, string> = {};
    if (!full_name?.trim()) errors.full_name = "Full name is required";
    if (!email?.trim()) errors.email = "Email is required";
    if (!password || password.length < 6) errors.password = "Password must be at least 6 characters";
    if (!org_name?.trim()) errors.org_name = "Organization name is required";
    if (!country?.trim()) errors.country = "Country is required";
    const validIndustries = ["Government", "Aviation", "Healthcare", "Education", "Finance", "Hospitality", "Other"];
    if (!industry || !validIndustries.includes(industry)) errors.industry = "Invalid industry";

    if (Object.keys(errors).length > 0) {
      return new Response(JSON.stringify({ error: "Validation failed", details: errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // Step 2: Create organization
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: org_name.trim(), country: country.trim(), industry })
      .select("id")
      .single();

    if (orgError) {
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Failed to create organization" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 3: Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      organization_id: orgData.id,
      full_name: full_name.trim(),
      email: email.trim(),
      role: "hr_admin",
    });

    if (profileError) {
      // Rollback: delete org and auth user
      await supabase.from("organizations").delete().eq("id", orgData.id);
      await supabase.auth.admin.deleteUser(userId);
      return new Response(JSON.stringify({ error: "Failed to create profile" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: userId, organization_id: orgData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
