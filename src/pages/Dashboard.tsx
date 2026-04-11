import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";

const Dashboard = () => {
  const { profile, organization } = useAuth();

  const checklist = [
    { label: "Account created", done: true },
    { label: "Configure org hierarchy", done: !!organization?.setup_complete, href: "/org/structure" },
    { label: "Add employees", done: false, href: "/org/employees" },
    { label: "Create appraisal cycle", done: false },
  ];

  return (
    <div className="px-8 py-10 max-w-2xl">
      {/* Welcome */}
      <h1 className="text-[28px] font-bold tracking-tight text-[#2c2c2b] font-[Space_Grotesk]">
        Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
      </h1>
      <p className="mt-1 text-sm text-[#7d7a75]">
        Complete these steps to get started.
      </p>

      {/* Checklist */}
      <div className="mt-8 rounded-xl border border-[rgba(0,0,0,0.08)] bg-white">
        <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="text-sm font-semibold text-[#2c2c2b]">Setup checklist</h2>
        </div>
        <div className="divide-y divide-[rgba(0,0,0,0.06)]">
          {checklist.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                ) : (
                  <Circle className="h-[18px] w-[18px] text-[#c4c1bc]" />
                )}
                <span className={`text-sm ${item.done ? "text-[#c4c1bc] line-through" : "text-[#2c2c2b]"}`}>
                  {item.label}
                </span>
              </div>
              {item.href && !item.done && (
                <Link to={item.href}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-[#7d7a75] hover:text-[#2c2c2b]">
                    Configure <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
