import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function RouteLoadingScreen() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <div
        className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        aria-hidden
      />
    </div>
  );
}

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <RouteLoadingScreen />;
  }

  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/onboarding/setup" replace />;
  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return <RouteLoadingScreen />;
  }

  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
