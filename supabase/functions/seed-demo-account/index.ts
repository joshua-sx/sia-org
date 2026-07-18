// Seed demo accounts (hr_admin, manager, employee) into a shared demo org.
// Idempotent: wipes any prior "Acme Corp (Demo)" org and rebuilds.
// Guarded by SEED_TOKEN header. Reuses auth users so passwords are stable.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SEED_TOKEN = Deno.env.get("SEED_TOKEN")!;

type Role = "hr_admin" | "manager" | "employee";

const DEMO_ACCOUNTS: {
  email: string;
  password: string;
  role: Role;
  first: string;
  last: string;
  title: string;
  unitKey: string;
}[] = [
  { email: "hr@sia.demo",       password: "DemoHR2026!",  role: "hr_admin", first: "Alex",   last: "Hart",    title: "Head of People",         unitKey: "people_talent" },
  { email: "manager@sia.demo",  password: "DemoMgr2026!", role: "manager",  first: "Morgan", last: "Lee",     title: "Engineering Manager",    unitKey: "eng_platform" },
  { email: "employee@sia.demo", password: "DemoEmp2026!", role: "employee", first: "Sam",    last: "Rivera",  title: "Software Engineer",      unitKey: "eng_platform_api" },
];

// Additional filler employees so managers have direct reports & lists feel real.
const EXTRA_EMPLOYEES: {
  first: string; last: string; email: string; title: string; unitKey: string; managerEmail?: string;
}[] = [
  // Morgan's direct reports
  { first: "Priya", last: "Shah",     email: "priya@sia.demo",    title: "Senior Engineer",   unitKey: "eng_platform_api", managerEmail: "manager@sia.demo" },
  { first: "Diego", last: "Martinez", email: "diego@sia.demo",    title: "Software Engineer", unitKey: "eng_platform_api", managerEmail: "manager@sia.demo" },
  // Sam already reports to Morgan (set below)
  // Other engineering
  { first: "Jamie", last: "Chen",     email: "jamie@sia.demo",    title: "Staff Engineer",    unitKey: "eng_platform" },
  { first: "Taylor",last: "Brooks",   email: "taylor@sia.demo",   title: "Engineering Manager", unitKey: "eng_web" },
  { first: "Riley", last: "Nguyen",   email: "riley@sia.demo",    title: "Frontend Engineer", unitKey: "eng_web", managerEmail: "taylor@sia.demo" },
  { first: "Casey", last: "Kim",      email: "casey@sia.demo",    title: "Frontend Engineer", unitKey: "eng_web", managerEmail: "taylor@sia.demo" },
  // Product
  { first: "Jordan",last: "Wells",    email: "jordan@sia.demo",   title: "Product Lead",      unitKey: "product_core" },
  { first: "Avery", last: "Patel",    email: "avery@sia.demo",    title: "Product Manager",   unitKey: "product_core", managerEmail: "jordan@sia.demo" },
  { first: "Noah",  last: "Garcia",   email: "noah@sia.demo",     title: "Product Designer",  unitKey: "product_design" },
  // People
  { first: "Robin", last: "Ellis",    email: "robin@sia.demo",    title: "People Partner",    unitKey: "people_talent", managerEmail: "hr@sia.demo" },
  // Finance
  { first: "Skyler",last: "Woods",    email: "skyler@sia.demo",   title: "Finance Lead",      unitKey: "finance_ops" },
  { first: "Quinn", last: "Foster",   email: "quinn@sia.demo",    title: "Financial Analyst", unitKey: "finance_ops", managerEmail: "skyler@sia.demo" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const token = req.headers.get("x-seed-token");
  if (!token || token !== SEED_TOKEN) {
    return json({ error: "unauthorized" }, 401);
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  try {
    // 1. Ensure auth users exist for the three demo accounts.
    const authUsers: Record<string, string> = {};
    for (const acc of DEMO_ACCOUNTS) {
      const id = await ensureAuthUser(sb, acc.email, acc.password);
      authUsers[acc.email] = id;
    }

    // 2. Delete any prior demo org (cascades employees, cycles, goals, participants, profiles).
    const { data: existing } = await sb.from("organizations").select("id").eq("name", "Acme Corp (Demo)");
    if (existing?.length) {
      for (const o of existing) {
        await sb.from("organizations").delete().eq("id", o.id);
      }
    }

    // 3. Create org.
    const { data: org, error: orgErr } = await sb
      .from("organizations")
      .insert({
        name: "Acme Corp (Demo)",
        country: "United States",
        industry: "Technology",
        setup_complete: true,
        structure_complete: true,
        people_complete: true,
        cycle_complete: true,
      })
      .select()
      .single();
    if (orgErr) throw orgErr;
    const orgId = org.id;

    // 4. Unit types (Division, Department, Team).
    const { data: unitTypes, error: utErr } = await sb
      .from("org_unit_types")
      .insert([
        { organization_id: orgId, name: "Division",   level: 1 },
        { organization_id: orgId, name: "Department", level: 2 },
        { organization_id: orgId, name: "Team",       level: 3 },
      ])
      .select();
    if (utErr) throw utErr;
    const divisionId = unitTypes.find((t) => t.level === 1)!.id;
    const departmentId = unitTypes.find((t) => t.level === 2)!.id;
    const teamId = unitTypes.find((t) => t.level === 3)!.id;

    // 5. Units (divisions -> departments -> teams).
    const unitIdByKey: Record<string, string> = {};

    async function mkUnit(key: string, name: string, unit_type_id: string, parent_id: string | null) {
      const { data, error } = await sb
        .from("org_units")
        .insert({ organization_id: orgId, name, unit_type_id, parent_id })
        .select()
        .single();
      if (error) throw error;
      unitIdByKey[key] = data.id;
    }

    await mkUnit("eng",     "Engineering", divisionId, null);
    await mkUnit("product", "Product",     divisionId, null);
    await mkUnit("people",  "People",      divisionId, null);
    await mkUnit("finance", "Finance",     divisionId, null);

    await mkUnit("eng_platform",     "Platform",     departmentId, unitIdByKey.eng);
    await mkUnit("eng_web",          "Web",          departmentId, unitIdByKey.eng);
    await mkUnit("product_core",     "Core Product", departmentId, unitIdByKey.product);
    await mkUnit("product_design",   "Design",       departmentId, unitIdByKey.product);
    await mkUnit("people_talent",    "Talent",       departmentId, unitIdByKey.people);
    await mkUnit("finance_ops",      "Finance Ops",  departmentId, unitIdByKey.finance);

    await mkUnit("eng_platform_api", "API Team",     teamId, unitIdByKey.eng_platform);

    // 6. Profiles for the three demo auth users.
    for (const acc of DEMO_ACCOUNTS) {
      const { error } = await sb.from("profiles").insert({
        id: authUsers[acc.email],
        organization_id: orgId,
        full_name: `${acc.first} ${acc.last}`,
        email: acc.email,
        role: acc.role,
      });
      if (error) throw error;
    }

    // 7. Employees. Insert all, then wire manager_id in a second pass.
    const empByEmail: Record<string, string> = {};
    const allEmployees = [
      ...DEMO_ACCOUNTS.map((a) => ({
        first: a.first, last: a.last, email: a.email, title: a.title, unitKey: a.unitKey,
        profileId: authUsers[a.email],
      })),
      ...EXTRA_EMPLOYEES.map((e) => ({ ...e, profileId: null as string | null })),
    ];

    for (const e of allEmployees) {
      const { data, error } = await sb
        .from("employees")
        .insert({
          organization_id: orgId,
          first_name: e.first,
          last_name: e.last,
          email: e.email,
          job_title: e.title,
          org_unit_id: unitIdByKey[e.unitKey],
          profile_id: e.profileId,
          employment_type: "full_time",
          employment_status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      empByEmail[e.email] = data.id;
    }

    // Wire managers.
    const managerLinks: [string, string][] = [
      // [employeeEmail, managerEmail]
      ["employee@sia.demo", "manager@sia.demo"],
      ["priya@sia.demo",    "manager@sia.demo"],
      ["diego@sia.demo",    "manager@sia.demo"],
      ["manager@sia.demo",  "jamie@sia.demo"], // Morgan reports to staff eng (so manager has own review too)
      ["riley@sia.demo",    "taylor@sia.demo"],
      ["casey@sia.demo",    "taylor@sia.demo"],
      ["avery@sia.demo",    "jordan@sia.demo"],
      ["noah@sia.demo",     "jordan@sia.demo"],
      ["robin@sia.demo",    "hr@sia.demo"],
      ["quinn@sia.demo",    "skyler@sia.demo"],
    ];
    for (const [empEmail, mgrEmail] of managerLinks) {
      await sb.from("employees").update({ manager_id: empByEmail[mgrEmail] }).eq("id", empByEmail[empEmail]);
    }

    // 8. Appraisal cycle with windows around today.
    const today = new Date();
    const d = (offsetDays: number) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + offsetDays);
      return dt.toISOString().slice(0, 10);
    };
    const { data: cycle, error: cErr } = await sb
      .from("appraisal_cycles")
      .insert({
        organization_id: orgId,
        name: "H1 2026 Review",
        status: "active",
        goal_window_start:    d(-60),
        goal_window_end:      d(-30),
        interim_window_start: d(-14),
        interim_window_end:   d(30),
        final_window_start:   d(31),
        final_window_end:     d(90),
        acknowledgement_due:  d(120),
      })
      .select()
      .single();
    if (cErr) throw cErr;
    const cycleId = cycle.id;

    // 9. Participants: enroll every employee that has a manager.
    // Determine each employee's current manager_id.
    const { data: allEmps } = await sb
      .from("employees")
      .select("id, email, manager_id")
      .eq("organization_id", orgId);
    if (!allEmps) throw new Error("employees fetch failed");

    const participantIdByEmpEmail: Record<string, string> = {};
    for (const e of allEmps) {
      if (!e.manager_id) continue;
      const { data: p, error } = await sb
        .from("cycle_participants")
        .insert({ cycle_id: cycleId, employee_id: e.id, manager_id: e.manager_id })
        .select()
        .single();
      if (error) throw error;
      participantIdByEmpEmail[e.email] = p.id;
    }

    // 10. Goals: 3 per participant (weights 40/30/30).
    for (const [_email, pid] of Object.entries(participantIdByEmpEmail)) {
      await sb.from("goals").insert([
        { participant_id: pid, title: "Deliver flagship project on time",     description: "Ship the primary initiative for the half.",         weight: 40 },
        { participant_id: pid, title: "Grow craft & technical depth",         description: "Level up in a chosen area with measurable output.", weight: 30 },
        { participant_id: pid, title: "Strengthen cross-team collaboration",  description: "Improve partnership with adjacent teams.",          weight: 30 },
      ]);
    }

    // 11. Rate + submit assessments to reach mixed states.
    // Fetch goals per participant to seed ratings.
    async function seedRatings(pid: string, stage: "interim" | "final", ratings: number[]) {
      const { data: goals } = await sb.from("goals").select("id").eq("participant_id", pid).order("created_at");
      if (!goals) return;
      for (let i = 0; i < goals.length; i++) {
        await sb.from("goal_ratings").insert({
          goal_id: goals[i].id,
          stage,
          rating: ratings[i] ?? 3,
          manager_comment: `Solid progress on this objective (${stage}).`,
        });
      }
    }

    async function submitStage(pid: string, stage: "interim" | "final", ack = false) {
      const { error } = await sb.rpc("_seed_submit_and_ack", { p_participant_id: pid, p_stage: stage, p_ack: ack });
      if (error) throw new Error(`submit ${stage} failed for ${pid}: ${error.message}`);
    }

    // Choose which participants get which state.
    const emails = Object.keys(participantIdByEmpEmail);

    // Full acknowledged: 1 (someone unrelated)
    const acknowledgedEmail   = "quinn@sia.demo";
    // Manager's own review: final submitted, acknowledgement pending
    const mgrReviewPendingAck = "manager@sia.demo";
    // 3 final submitted (includes the manager's row above)
    const finalSubmittedEmails = new Set([acknowledgedEmail, mgrReviewPendingAck, "priya@sia.demo"]);
    // 5 interim submitted (final not yet)
    const interimSubmittedEmails = new Set([
      "diego@sia.demo",
      "riley@sia.demo",
      "casey@sia.demo",
      "avery@sia.demo",
      "robin@sia.demo",
    ]);
    // Employee account: interim in progress — ratings exist but not submitted (so UI shows goals & pending review)
    const employeeInProgress = "employee@sia.demo";

    for (const email of emails) {
      const pid = participantIdByEmpEmail[email];

      if (finalSubmittedEmails.has(email)) {
        await seedRatings(pid, "interim", [4, 3, 4]);
        await submitStage(pid, "interim");
        await seedRatings(pid, "final",   [4, 4, 5]);
        await submitStage(pid, "final", email === acknowledgedEmail);
      } else if (interimSubmittedEmails.has(email)) {
        await seedRatings(pid, "interim", [3, 4, 3]);
        await submitStage(pid, "interim");
      } else if (email === employeeInProgress) {
        await seedRatings(pid, "interim", [3, 3, 3]); // ratings drafted, not submitted
      }
      // else: participant enrolled with goals only (blank slate for lists)
    }

    return json({
      ok: true,
      organization: "Acme Corp (Demo)",
      accounts: DEMO_ACCOUNTS.map((a) => ({ email: a.email, password: a.password, role: a.role })),
      counts: {
        employees: allEmps.length,
        participants: emails.length,
        finalSubmitted: finalSubmittedEmails.size,
        interimSubmitted: interimSubmittedEmails.size,
      },
    });
  } catch (err) {
    console.error("seed-demo-account failed", err);
    return json({ error: (err as Error).message }, 500);
  }
});

async function ensureAuthUser(sb: ReturnType<typeof createClient>, email: string, password: string): Promise<string> {
  // Try to create; if exists, look it up and reset the password.
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (created?.user) return created.user.id;

  // On conflict, find via listUsers and update the password.
  if (createErr && !/already/i.test(createErr.message)) {
    // If not the "already registered" error, still try to look up.
  }

  // Paginate a bit — should find on first page for the small demo set.
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (found) {
      await sb.auth.admin.updateUserById(found.id, { password, email_confirm: true });
      return found.id;
    }
    if (data.users.length < 200) break;
  }
  throw new Error(`could not find or create auth user for ${email}`);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
