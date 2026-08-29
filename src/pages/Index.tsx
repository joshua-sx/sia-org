import { PageHead } from "@/components/PageHead";
import { BackToTop } from "@/components/landing/BackToTop";
import { LandingFooter, LandingSections } from "@/components/landing/LandingSections";
import { LandingHero } from "@/components/landing/LandingHero";
import { Navbar } from "@/components/landing/Navbar";
import { ScrollProgressBar } from "@/components/landing/ScrollProgressBar";

const Index = () => (
  <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
    <PageHead
      title="Sia — Your organization, AI-ready"
      description="Structure people, roles, goals, and performance in Sia. Connect to ChatGPT and ask your organization anything."
      path="/"
    />
    <ScrollProgressBar />
    <Navbar />
    <BackToTop />
    <main>
      <LandingHero />
      <LandingSections />
    </main>
    <LandingFooter />
  </div>
);

export default Index;
