import { PageHead } from "@/components/PageHead";
import { BackToTop } from "@/components/landing/BackToTop";
import { LandingFooter, LandingSections } from "@/components/landing/LandingSections";
import { LandingHero } from "@/components/landing/LandingHero";
import { Navbar } from "@/components/landing/Navbar";
import { ScrollProgressBar } from "@/components/landing/ScrollProgressBar";

const Index = () => (
  <div className="min-h-screen bg-white text-black antialiased" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
    <PageHead
      title="SIA — Performance reviews that move people forward"
      description="One clear place for goals, feedback, and every step of your performance review process."
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
