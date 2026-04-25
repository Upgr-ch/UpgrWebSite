import React, { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

export const HeroSection = () => {
  const heroRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const fadeElements = heroRef.current?.querySelectorAll('.fade-up');
    fadeElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleDiscoverClick = () => {
    const offresSection = document.getElementById('offres');
    offresSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="accueil"
      ref={heroRef}
      className="relative w-full min-h-screen flex items-center justify-center"
      style={{
        background:
          'radial-gradient(ellipse at 30% 20%, hsl(45 86% 76% / 0.04) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(43 65% 43% / 0.03) 0%, transparent 50%)',
      }}
    >
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-16 py-20">
        {/* Text Content */}
        <div className="flex-1 text-center md:text-left fade-up">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold italic leading-tight mb-2 shimmer-text">
            UpGrade
          </h1>
          <p className="text-xs tracking-widest-plus uppercase mb-8 text-gold-deep">
            Learning & Development
          </p>
          <p className="text-lg md:text-xl font-light italic leading-relaxed mb-10 text-foreground/75">
            Notre mission, orchestrer votre Learning & Development : audit,
            structuration, pilotage et sourcing.
          </p>
          <Button
            onClick={handleDiscoverClick}
            variant="outline"
            className="border-gold text-gold hover:bg-gold hover:text-primary-foreground transition-all duration-300 px-8 py-6 text-sm tracking-wider uppercase"
          >
            Découvrir les solutions
          </Button>
        </div>

        {/* Hero SVG Illustration */}
        <div className="flex-1 hidden md:flex items-center justify-center fade-up">
          <svg viewBox="0 0 320 320" className="w-full max-w-sm svg-icon">
            <defs>
              <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(45 86% 76%)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(43 65% 43%)" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <circle cx="160" cy="160" r="140" fill="none" stroke="url(#heroGrad)" strokeWidth="1.5" />
            <circle cx="160" cy="160" r="110" fill="none" stroke="hsl(45 86% 76%)" strokeWidth="0.8" opacity="0.25" />
            <g opacity="0.35" stroke="hsl(45 86% 76%)" strokeWidth="1.2" fill="none">
              <path
                d="M 160 60 Q 220 100 220 160 Q 220 220 160 260 Q 100 220 100 160 Q 100 100 160 60"
                strokeDasharray="5,3"
              />
            </g>
            <circle cx="160" cy="160" r="35" fill="none" stroke="hsl(43 65% 43%)" strokeWidth="1.5" opacity="0.5" />
            <circle cx="160" cy="160" r="12" fill="hsl(45 86% 76%)" opacity="0.8" />
            <g opacity="0.15">
              <line x1="160" y1="40" x2="160" y2="280" stroke="hsl(45 86% 76%)" strokeWidth="1" />
              <line x1="40" y1="160" x2="280" y2="160" stroke="hsl(45 86% 76%)" strokeWidth="1" />
            </g>
          </svg>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-5 h-5 text-gold/40" />
      </div>
    </section>
  );
};
