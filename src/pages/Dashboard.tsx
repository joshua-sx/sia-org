import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Users,
  CheckCircle2,
  Circle,
  LogOut,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

const sidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Org Structure", href: "/org/structure", icon: Building2 },
  { label: "Employees", href: "/org/employees", icon: Users },
];

const Dashboard = () => {
  const { profile, organization, signOut } = useAuth();

  const checklist = [
    { label: "Account created", done: true },
    { label: "Configure org hierarchy", done: false, href: "/org/structure" },
    { label: "Add employees", done: false },
    { label: "Create appraisal cycle", done: false },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar-background text-sidebar-foreground md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-5">
          <span className="text-lg font-bold tracking-tight font-[Space_Grotesk] text-sidebar-primary-foreground">
            SIA
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight font-[Space_Grotesk] md:hidden">SIA</span>
            {organization && (
              <span className="text-sm font-medium text-muted-foreground">{organization.name}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {profile && <span className="text-sm">{profile.full_name}</span>}
            <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-10">
          <h1 className="text-2xl font-bold tracking-tight">Getting started</h1>
          <p className="mt-1 text-muted-foreground">Complete these steps to set up your organization.</p>

          <Card className="mt-8 max-w-xl">
            <CardHeader>
              <CardTitle className="text-lg">Setup checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.done ? (
                      <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                  </div>
                  {item.href && !item.done && (
                    <Link to={item.href}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        Configure <ChevronRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
