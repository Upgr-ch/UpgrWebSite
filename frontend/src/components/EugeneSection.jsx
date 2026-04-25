import React, { useEffect, useRef } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

export const EugeneSection = () => {
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
    <section
      id="eugene"
      ref={sectionRef}
      className="w-full py-28 px-6"
      style={{ background: 'hsl(45 86% 76% / 0.015)' }}
    >
      <div className="max-w-3xl mx-auto text-center fade-up">
        <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">Eugène</p>
        <h2 className="text-3xl md:text-4xl font-bold italic mb-6">Eugène</h2>
        <p className="text-base font-light text-foreground/65 mb-8 max-w-xl mx-auto">
          Votre Majordome Pédagogique qui transforme votre expertise en plan de formation structuré
        </p>
        <Link to="/eugene">
          <Button
            className="bg-gold hover:bg-gold-glow text-midnight font-medium px-8 py-6 shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30"
          >
            Découvrir Eugène
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
