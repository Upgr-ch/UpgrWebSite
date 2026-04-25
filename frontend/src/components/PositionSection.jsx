import React, { useEffect, useRef } from 'react';

export const PositionSection = () => {
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
    <section id="positionnement" ref={sectionRef} className="w-full py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* Text Content */}
          <div className="flex-1 fade-up">
            <div className="gold-line mb-12"></div>
            <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">
              Notre mission
            </p>
            <h2 className="text-3xl md:text-4xl font-bold italic mb-8">
              Votre partenaire <span className="text-gold">L&D</span> externe
            </h2>
            <p className="text-base md:text-lg font-light leading-relaxed text-foreground/65">
              UpGrade intervient comme solution externe spécialisée dans le Learning &
              Development. Auditer, structurer, piloter et sourcer les dispositifs L&D.
            </p>
          </div>

          {/* SVG Illustration */}
          <div className="flex-1 hidden md:flex items-center justify-center fade-up">
            <svg viewBox="0 0 320 320" className="w-full max-w-sm svg-icon">
              <defs>
                <linearGradient id="posGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(45 86% 76%)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(43 65% 43%)" stopOpacity="0.12" />
                </linearGradient>
              </defs>
              <rect x="50" y="80" width="220" height="160" fill="none" stroke="url(#posGrad)" strokeWidth="1.5" rx="2" />
              <line x1="80" y1="100" x2="240" y2="100" stroke="hsl(45 86% 76%)" strokeWidth="0.8" opacity="0.4" />
              <circle cx="90" cy="140" r="8" fill="none" stroke="hsl(45 86% 76%)" strokeWidth="1.2" opacity="0.6" />
              <circle cx="160" cy="140" r="8" fill="none" stroke="hsl(45 86% 76%)" strokeWidth="1.2" opacity="0.6" />
              <circle cx="230" cy="140" r="8" fill="none" stroke="hsl(45 86% 76%)" strokeWidth="1.2" opacity="0.6" />
              <path d="M 90 160 Q 160 200 230 160" fill="none" stroke="hsl(43 65% 43%)" strokeWidth="1.5" opacity="0.4" />
              <line x1="60" y1="195" x2="260" y2="195" stroke="hsl(45 86% 76%)" strokeWidth="0.8" opacity="0.3" />
              <g opacity="0.25">
                <line x1="70" y1="210" x2="110" y2="210" stroke="hsl(45 86% 76%)" strokeWidth="0.8" />
                <line x1="130" y1="210" x2="190" y2="210" stroke="hsl(45 86% 76%)" strokeWidth="0.8" />
                <line x1="210" y1="210" x2="250" y2="210" stroke="hsl(45 86% 76%)" strokeWidth="0.8" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};
