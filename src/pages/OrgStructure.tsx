import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const OrgStructure = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="text-center">
      <h1 className="text-2xl font-bold tracking-tight">Organization Structure</h1>
      <p className="mt-2 text-muted-foreground">This feature will be available in the next step.</p>
      <Button asChild variant="ghost" className="mt-6 gap-2">
        <Link to="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      </Button>
    </div>
  </div>
);

export default OrgStructure;
