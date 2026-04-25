import React, { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from './ui/badge';

export const AcademySection = () => {
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
    <section id="academy" ref={sectionRef} className="w-full py-28 px-6">
      <div className="max-w-3xl mx-auto text-center fade-up">
        <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">
          Edouard Consultant
        </p>
        <h2 className="text-3xl md:text-4xl font-bold italic mb-6">
          Edouard <span className="text-gold">Consultant</span>
        </h2>
        <Badge
          variant="outline"
          className="inline-flex items-center gap-2 px-5 py-2.5 border-foreground/10"
        >
          <Clock className="w-4 h-4 text-gold-deep" />
          <span className="text-sm font-light italic text-foreground/50">
            Bientôt disponible : Consultant expert en formation et développement, accompagnement
            personnalisé pour vos projets L&D
          </span>
        </Badge>
      </div>
    </section>
  );
};
