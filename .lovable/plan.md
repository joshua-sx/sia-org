

# SIA — Step 1: Auth Foundation & Tenant Isolation

## Overview
Build the authentication foundation, organization creation, JWT-based tenant isolation, and empty dashboard shell for a multi-tenant HR performance appraisal SaaS.

## Backend Setup (Lovable Cloud / Supabase)

### Database Schema
- **organizations** table: id, name, country, industry, setup_complete, created_at
- **profiles** table: id (references auth.users), organization_id, full_name, email, role (hr_admin/manager/employee), created_at
- Indexes on profiles for org lookups and role queries
- RLS enabled and forced on both tables immediately

### RLS Policies
- **organizations**: SELECT/UPDATE restricted to users whose JWT `organization_id` matches `organizations.id`
- **profiles**: SELECT scoped to same org via JWT claim; UPDATE restricted to own profile only
- All JWT references wrapped in `(SELECT ...)` for performance
- No permissive write policies — inserts handled via service role

### JWT Custom Claims Hook
- PostgreSQL function `custom_jwt_claims` that injects `organization_id` and `user_role` into the access token on every login/refresh
- Must be registered manually in Supabase Dashboard → Auth → Hooks after deployment
- This is the lynchpin — all future RESTRICTIVE RLS policies depend on it

### Edge Function: Signup
- Receives: full_name, email, password, org_name, country, industry
- Atomic sequence using service role client:
  1. Create auth user
  2. Insert organization
  3. Insert profile (role = hr_admin)
  4. If any step fails, roll back (delete created user/org)
- Input validation with Zod
- Returns success/error with clear messages

## Frontend Pages

### Landing Page (`/`)
- Clean marketing page: SIA wordmark, headline, subheadline, CTA → /signup, "Sign in" link → /login
- Auto-redirects authenticated users to /dashboard

### Signup Page (`/signup`)
- Form: full name, email, password, confirm password, org name, country dropdown, industry dropdown (Government, Aviation, Healthcare, Education, Finance, Hospitality, Other)
- Inline validation — all fields required, password match check
- Calls the signup edge function on submit
- On success, logs user in and redirects to /dashboard

### Login Page (`/login`)
- Email/password fields + "Sign in with Google" button
- Link to /signup
- On success → /dashboard

### Dashboard (`/dashboard`) — Empty Shell
- Header: SIA wordmark, org name, user's full name, logout button
- Sidebar: placeholder nav links (Organization → Structure, Organization → Employees)
- Main area: setup checklist (Account created ✅, Configure org hierarchy ⬜, Add employees ⬜, Create appraisal cycle ⬜)
- "Configure org hierarchy" links to /org/structure (placeholder page)

### Route Protection
- `ProtectedRoute` wrapper: unauthenticated → /login
- Public routes (`/`, `/login`, `/signup`): authenticated → /dashboard
- Auth context provider using `onAuthStateChange` + `getSession`

## Auth Context
- React context providing user session, profile data (name, role, org), loading state
- Fetches profile after login to display org name and user info
- Logout clears session and redirects to /login

## Important Notes
- Google OAuth requires manual configuration in Supabase Dashboard (or Lovable Cloud auth settings)
- The JWT hook must be registered manually in the Supabase Dashboard after the migration runs
- No org structure, employee management, or appraisal features in this step

