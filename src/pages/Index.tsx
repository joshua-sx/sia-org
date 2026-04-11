import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <span className="text-xl font-bold tracking-tight font-[Space_Grotesk]">SIA</span>
        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Sign in
        </Link>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Performance appraisals that actually work.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          SIA gives HR teams, managers, and employees one place to set goals, track progress, and complete appraisals — without the paperwork.
        </p>
        <Button asChild size="lg" className="mt-10 gap-2 text-base">
          <Link to="/signup">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} SIA. All rights reserved.
      </footer>
    </div>
  );
};

export default Index;
