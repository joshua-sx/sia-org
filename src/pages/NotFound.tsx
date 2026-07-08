import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandMark";
import { PageHead } from "@/components/PageHead";

const NotFound = () => (
  <>
    <PageHead
      title="Page not found | SIA"
      description="The page you're looking for doesn't exist."
      path="/404"
    />
    <div className="relative flex min-h-screen items-center justify-center bg-[hsl(var(--surface))] px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, hsl(var(--accent-blue) / 0.08), transparent 70%)",
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-raised))] p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
        <div className="mb-6 flex justify-center">
          <BrandMark />
        </div>
        <p className="text-sm font-medium uppercase tracking-wide text-[hsl(var(--ink-muted))]">404</p>
        <h1
          className="mt-2 text-2xl font-semibold tracking-tight text-[hsl(var(--ink-strong))]"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Page not found
        </h1>
        <p className="mt-2 text-sm text-[hsl(var(--ink-muted))]">
          This page doesn't exist or may have been moved.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/">Return to home</Link>
        </Button>
      </div>
    </div>
  </>
);

export default NotFound;
