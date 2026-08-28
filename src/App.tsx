import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ProtectedRoute, PublicRoute, SessionRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import OrgStructure from "./pages/OrgStructure";
import OrgEmployees from "./pages/OrgEmployees";
import AppraisalCycles from "./pages/AppraisalCycles";
import AppraisalCycleDetail from "./pages/AppraisalCycleDetail";
import MyGoals from "./pages/MyGoals";
import MyAssessments from "./pages/MyAssessments";
import AssessmentDetail from "./pages/AssessmentDetail";
import MyReview from "./pages/MyReview";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CompleteSignup from "./pages/CompleteSignup";
import OnboardingSetup from "./pages/OnboardingSetup";
import BlogPerformanceManagementExamples from "./pages/BlogPerformanceManagementExamples";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
            <Route path="/blog/performance-management-examples" element={<BlogPerformanceManagementExamples />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/complete-signup" element={<CompleteSignup />} />
            <Route path="/onboarding/setup" element={<SessionRoute><AppLayout><OnboardingSetup /></AppLayout></SessionRoute>} />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/org/structure" element={<ProtectedRoute><AppLayout><OrgStructure /></AppLayout></ProtectedRoute>} />
            <Route path="/org/employees" element={<ProtectedRoute><AppLayout><OrgEmployees /></AppLayout></ProtectedRoute>} />
            <Route path="/appraisals" element={<ProtectedRoute><AppLayout><AppraisalCycles /></AppLayout></ProtectedRoute>} />
            <Route path="/appraisals/goals" element={<ProtectedRoute><AppLayout><MyGoals /></AppLayout></ProtectedRoute>} />
            <Route path="/appraisals/assessments" element={<ProtectedRoute><AppLayout><MyAssessments /></AppLayout></ProtectedRoute>} />
            <Route path="/appraisals/assessments/:participantId" element={<ProtectedRoute><AppLayout><AssessmentDetail /></AppLayout></ProtectedRoute>} />
            <Route path="/appraisals/my-review" element={<ProtectedRoute><AppLayout><MyReview /></AppLayout></ProtectedRoute>} />
            <Route path="/appraisals/:id" element={<ProtectedRoute><AppLayout><AppraisalCycleDetail /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
