import { useNavigate } from 'react-router-dom';
import { HeroSection } from './HeroSection';
import { SocialProofSection } from './SocialProofSection';
import { HowItWorksSection } from './HowItWorksSection';
import { WhyGatherlySection } from './WhyGatherlySection';
import { FeaturesSection } from './FeaturesSection';
import { ShowcaseSection } from './ShowcaseSection';
import { TestimonialsSection } from './TestimonialsSection';
import { CTASection } from './CTASection';
import { Footer } from './Footer';

export function LandingPage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onGetStarted={handleGetStarted} onHowItWorks={handleHowItWorks} />
      <SocialProofSection />
      <HowItWorksSection />
      <WhyGatherlySection />
      <FeaturesSection />
      <ShowcaseSection />
      <TestimonialsSection />
      <CTASection onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
}
