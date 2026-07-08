import { PageHead } from "@/components/PageHead";
import { BackToTop } from "@/components/landing/BackToTop";
import { LandingFooter, LandingSections } from "@/components/landing/LandingSections";
import { LandingHero } from "@/components/landing/LandingHero";
import { Navbar } from "@/components/landing/Navbar";
import { ScrollProgressBar } from "@/components/landing/ScrollProgressBar";

const Index = () => (
  <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
    <PageHead
      title="SIA — Performance appraisals for structured orgs"
      description="Goal-setting, 360° reviews, and performance analytics for government, aviation, healthcare, and education."
      path="/"
    />
    <ScrollProgressBar />
    <Navbar />
    <BackToTop />
    <LandingHero />
    <LandingSections />
    <LandingFooter />
  </div>
);

export default Index;
