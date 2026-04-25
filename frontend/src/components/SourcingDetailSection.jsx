import React, { useEffect, useRef } from 'react';
import { Target, CheckCircle, Link2, Compass } from 'lucide-react';
import { Badge } from './ui/badge';

const steps = [
  { icon: Target, label: 'Identifier' },
  { icon: CheckCircle, label: 'Sélectionner' },
  { icon: Link2, label: 'Intégrer' },
  { icon: Compass, label: 'Piloter', isActive: true },
];

export const SourcingDetailSection = () => {
  const sectionRef = useRef(null);

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

    const fadeElements = sectionRef.current?.querySelectorAll('.fade-up');
    fadeElements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="w-full py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* SVG Illustration */}
          <div className="flex-1 hidden md:flex items-center justify-center fade-up">
            <svg viewBox="0 0 320 320" className="w-full max-w-sm svg-icon">
              <defs>
                <linearGradient id="sourcingPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(45 86% 76%)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="hsl(43 65% 43%)" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="80" r="16" fill="none" stroke="url(#sourcingPathGrad)" strokeWidth="2" />
              <circle cx="260" cy="100" r="16" fill="none" stroke="url(#sourcingPathGrad)" strokeWidth="2" />
              <circle cx="160" cy="200" r="16" fill="none" stroke="url(#sourcingPathGrad)" strokeWidth="2" />
              <circle cx="80" cy="260" r="16" fill="none" stroke="url(#sourcingPathGrad)" strokeWidth="2" />
              <path d="M 75 90 Q 150 100 250 100" fill="none" stroke="hsl(45 86% 76%)" strokeWidth="1.5" opacity="0.6" />
              <path d="M 250 115 Q 200 150 175 190" fill="none" stroke="hsl(45 86% 76%)" strokeWidth="1.5" opacity="0.6" />
              <path d="M 150 215 Q 120 240 95 260" fill="none" stroke="hsl(45 86% 76%)" strokeWidth="1.5" opacity="0.6" />
              <circle cx="60" cy="80" r="5" fill="hsl(45 86% 76%)" opacity="0.9" />
              <circle cx="260" cy="100" r="5" fill="hsl(45 86% 76%)" opacity="0.9" />
              <circle cx="160" cy="200" r="5" fill="hsl(45 86% 76%)" opacity="0.9" />
              <circle cx="80" cy="260" r="5" fill="hsl(45 86% 76%)" opacity="0.9" />
            </svg>
          </div>

          {/* Text Content */}
          <div className="flex-1 fade-up">
            <div className="gold-line mb-12"></div>
            <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">Sourcing</p>
            <h2 className="text-3xl md:text-4xl font-bold italic mb-6">
              Sourcing <span className="text-gold">maîtrisé</span>
            </h2>
            <p className="text-base font-light text-foreground/65 mb-12 max-w-3xl">
              UpGrade identifie, sélectionne et pilote les prestataires comme composants d'un
              système global de L&D.
            </p>

            {/* Process Steps */}
            <div className="flex flex-wrap justify-start gap-4 mb-12">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Badge
                    key={step.label}
                    variant={step.isActive ? 'default' : 'outline'}
                    className={`flex items-center gap-2 px-5 py-3 text-sm font-light ${
                      step.isActive
                        ? 'bg-transparent border-gold text-gold'
                        : 'border-foreground/10 text-foreground'
                    } ${index < steps.length - 1 ? 'relative' : ''}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{step.label}</span>
                    {index < steps.length - 1 && (
                      <span className="hidden md:inline-block ml-4 text-gold/60">→</span>
                    )}
                  </Badge>
                );
              })}
            </div>

            <p className="text-center text-sm italic text-foreground/40">
              Nous sélectionnons, structurons et pilotons.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
