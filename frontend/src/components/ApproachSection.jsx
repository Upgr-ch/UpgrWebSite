import React, { useEffect, useRef } from 'react';

export const ApproachSection = () => {
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
      ref={sectionRef}
      className="w-full py-28 px-6"
      style={{ background: 'hsl(45 86% 76% / 0.015)' }}
    >
      <div className="max-w-4xl mx-auto text-center fade-up">
        <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">
          Notre approche
        </p>
        <h2 className="text-3xl md:text-4xl font-bold italic mb-8">
          Ce que nous <span className="text-gold">faisons</span>
        </h2>
        <p className="text-base font-light leading-relaxed text-foreground/65">
          UpGrade structure votre Learning & Development en combinant audit, conception, pilotage
          et sourcing via un système cohérent, agile et durable, au bénéfice de vos collaborateurs
          et de votre entreprise.
        </p>
      </div>
    </section>
  );
};
