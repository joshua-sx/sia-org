

# Improve Dashboard with Shadcn Sidebar — Notion-inspired

## Overview
Replace the custom sidebar in Dashboard (and OrgStructure/OrgEmployees) with a shared layout using the Shadcn `Sidebar` component. Adopt Notion-style aesthetics: warm `#f9f8f7` background, clean typography, subtle borders, minimal icons.

## Architecture

Create a shared `AppLayout` component that wraps all authenticated pages with the sidebar + header, eliminating the duplicated sidebar code across Dashboard, OrgStructure, and OrgEmployees.

```text
SidebarProvider
├── AppSidebar (collapsible="icon")
│   ├── SidebarHeader — SIA logo + org name
│   ├── SidebarContent — Nav groups (Dashboard, Org Structure, Employees)
│   └── SidebarFooter — User avatar + name + sign out
└── Main area
    ├── Header (SidebarTrigger + breadcrumb/page title)
    └── {children} (page content)
```

## Changes

### 1. Create `src/components/AppSidebar.tsx`
Notion-style sidebar using Shadcn Sidebar primitives:
- `SidebarHeader`: SIA wordmark + org name
- `SidebarContent`: Navigation items using `SidebarMenu`/`SidebarMenuItem`/`SidebarMenuButton` with `NavLink` for active state highlighting
- `SidebarFooter`: User dropdown (avatar, name, sign out)
- Uses `collapsible="icon"` so it collapses to icon strip

### 2. Create `src/components/AppLayout.tsx`
Shared layout wrapper:
- `SidebarProvider` + `AppSidebar` + main content area
- Header bar with `SidebarTrigger`, page title, org name
- Warm background (`bg-[#f9f8f7]`)
- All authenticated routes use this layout

### 3. Rewrite `src/pages/Dashboard.tsx`
- Remove custom sidebar/header (now in AppLayout)
- Keep setup checklist content, restyle with Notion aesthetics:
  - Larger heading, warm card style
  - Clean check items with subtle styling
  - Welcome message using profile name

### 4. Update `src/pages/OrgStructure.tsx`
- Remove duplicated sidebar code, wrap content only
- Keep all existing functionality (wizard, tree, modals)

### 5. Update `src/pages/OrgEmployees.tsx`
- Same: remove sidebar, keep content

### 6. Update `src/App.tsx`
- Wrap all `ProtectedRoute` children with `AppLayout`

## Notion Design Tokens
- Sidebar bg: `#f9f8f7`, text: `#2c2c2b`, muted: `#7d7a75`
- Main bg: `white`, cards: white with `border-[rgba(0,0,0,0.08)]` and `rounded-xl`
- Active nav item: subtle `bg-[rgba(0,0,0,0.04)]` highlight
- Icons: `lucide-react`, 16px, `text-[#8e8b86]`

## Files

| Action | File |
|--------|------|
| Create | `src/components/AppSidebar.tsx` |
| Create | `src/components/AppLayout.tsx` |
| Rewrite | `src/pages/Dashboard.tsx` |
| Modify | `src/pages/OrgStructure.tsx` — remove sidebar |
| Modify | `src/pages/OrgEmployees.tsx` — remove sidebar |
| Modify | `src/App.tsx` — wrap protected routes with AppLayout |

