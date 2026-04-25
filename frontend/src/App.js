import React from 'react';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { PositionSection } from './components/PositionSection';
import { SolutionsSection } from './components/SolutionsSection';
import { SourcingDetailSection } from './components/SourcingDetailSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ValuesSection } from './components/ValuesSection';
import { ApproachSection } from './components/ApproachSection';
import { ProcessSection } from './components/ProcessSection';
import { EugeneSection } from './components/EugeneSection';
import { AcademySection } from './components/AcademySection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import './App.css';

function App() {
  return (
    <div className="w-full min-h-screen bg-midnight text-foreground overflow-x-hidden">
      <Navigation />
      <main>
        <HeroSection />
        <PositionSection />
        <SolutionsSection />
        <SourcingDetailSection />
        <TestimonialsSection />
        <ValuesSection />
        <ApproachSection />
        <ProcessSection />
        <EugeneSection />
        <AcademySection />
        <ContactSection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}

export default App;
