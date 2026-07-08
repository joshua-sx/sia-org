import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const VALID_INDUSTRIES = ["Government", "Aviation", "Healthcare", "Education", "Finance", "Hospitality", "Other"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json();
    const { full_name, org_name, country, industry } = body ?? {};
    const errors: Record<string, string> = {};
    if (!full_name?.trim()) errors.full_name = "Full name is required";
    if (!org_name?.trim()) errors.org_name = "Organization name is required";
    if (!country?.trim()) errors.country = "Country is required";
    if (!industry || !VALID_INDUSTRIES.includes(industry)) errors.industry = "Invalid industry";
    if (Object.keys(errors).length) {
      return new Response(JSON.stringify({ error: "Validation failed", details: errors }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Idempotent: if profile already exists, return it.
    const { data: existing } = await admin.from("profiles").select("id, organization_id").eq("id", user.id).maybeSingle();
    if (existing) {
      return new Response(JSON.stringify({ success: true, user_id: user.id, organization_id: existing.organization_id, already: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: orgData, error: orgErr } = await admin
      .from("organizations")
      .insert({ name: org_name.trim(), country: country.trim(), industry })
      .select("id").single();
    if (orgErr) {
      return new Response(JSON.stringify({ error: "Failed to create organization" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: profErr } = await admin.from("profiles").insert({
      id: user.id,
      organization_id: orgData.id,
      full_name: full_name.trim(),
      email: user.email ?? "",
      role: "hr_admin",
    });
    if (profErr) {
      await admin.from("organizations").delete().eq("id", orgData.id);
      return new Response(JSON.stringify({ error: "Failed to create profile" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, user_id: user.id, organization_id: orgData.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
