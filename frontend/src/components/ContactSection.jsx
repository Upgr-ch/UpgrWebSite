import React, { useEffect, useRef } from 'react';
import { Mail } from 'lucide-react';
import { Button } from './ui/button';

export const ContactSection = () => {
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
      id="contact"
      ref={sectionRef}
      className="w-full py-28 px-6"
      style={{
        background: 'linear-gradient(180deg, hsl(45 86% 76% / 0.03) 0%, transparent 100%)',
      }}
    >
      <div className="max-w-3xl mx-auto text-center fade-up">
        <div className="gold-line mb-12"></div>
        <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">Contact</p>
        <h2 className="text-2xl md:text-3xl font-bold italic leading-relaxed mb-8">
          Pour toute information ou demande de devis :
        </h2>
        <div className="mt-6">
          <Button
            variant="link"
            className="text-gold hover:underline text-base"
            onClick={() => (window.location.href = 'mailto:kl@upgr.ch')}
          >
            <Mail className="w-4 h-4 mr-2" />
            kl@upgr.ch
          </Button>
          <p className="text-xs font-light italic text-foreground/40 mt-4 max-w-md mx-auto">
            Nous mettons un point d'honneur à répondre à chaque message
          </p>
        </div>
      </div>
    </section>
  );
};
