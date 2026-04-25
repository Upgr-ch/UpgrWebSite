import React, { useEffect, useRef } from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Badge } from './ui/badge';

const processSteps = [
  { number: '01', label: 'Insight' },
  { number: '02', label: 'Transform' },
  { number: '03', label: 'Continuum', isActive: true },
];

export const ProcessSection = () => {
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
      <div className="max-w-5xl mx-auto fade-up">
        <div className="text-center mb-16">
          <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">Processus</p>
          <h2 className="text-3xl md:text-4xl font-bold italic">
            Le système <span className="text-gold">UpGrade</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
          {processSteps.map((step, index) => (
            <React.Fragment key={step.number}>
              <Badge
                variant={step.isActive ? 'default' : 'outline'}
                className={`flex items-center gap-3 px-6 py-4 flex-shrink-0 ${
                  step.isActive
                    ? 'bg-transparent border-gold text-gold'
                    : 'border-foreground/10 text-foreground'
                }`}
              >
                <span className="text-xs font-bold text-gold-deep">{step.number}</span>
                <span className="text-sm font-light">{step.label}</span>
              </Badge>
              {index < processSteps.length - 1 && (
                <>
                  <ArrowRight className="hidden md:block w-4 h-4 text-gold/60" />
                  <ArrowDown className="md:hidden w-4 h-4 text-gold/60" />
                </>
              )}
            </React.Fragment>
          ))}
        </div>

        <p className="text-center text-sm italic text-foreground/40">
          Un système taylor made, structuré, piloté et optimisé dans le temps
        </p>
      </div>
    </section>
  );
};
