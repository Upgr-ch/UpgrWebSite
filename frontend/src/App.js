import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HeroSection } from './components/HeroSection';
import { PositionSection } from './components/PositionSection';
import { SolutionsSection } from './components/SolutionsSection';
import { SourcingDetailSection } from './components/SourcingDetailSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ValuesSection } from './components/ValuesSection';
import { ApproachSection } from './components/ApproachSection';
import { ProcessSection } from './components/ProcessSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ScrollToTop } from './components/ScrollToTop';
import { EugeneLanding } from './pages/EugeneLanding';
import { EdouardLanding } from './pages/EdouardLanding';
import './App.css';

const HomePage = () => {
  useEffect(() => {
    document.title = 'UpGrade | Learning & Development';
  }, []);
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
      <ContactSection />
    </main>
    <Footer />
    <ScrollToTop />
  </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/eugene" element={<EugeneLanding />} />
        <Route path="/edouard" element={<EdouardLanding />} />
      </Routes>
    </Router>
  );
}

export default App;
