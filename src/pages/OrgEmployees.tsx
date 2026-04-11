import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const OrgEmployees = () => (
  <div className="flex flex-1 items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold tracking-tight text-[#2c2c2b]">Employees</h1>
      <p className="mt-2 text-sm text-[#7d7a75]">This feature will be available in the next step.</p>
      <Button asChild variant="ghost" className="mt-6 gap-2 text-[#7d7a75]">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      </Button>
    </div>
  </div>
);

export default OrgEmployees;
