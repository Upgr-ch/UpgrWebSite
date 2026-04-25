import React, { useEffect, useRef } from 'react';
import { User, Building } from 'lucide-react';

const values = [
  {
    icon: User,
    title: 'Collaborateurs',
    items: ['Lisibilité', 'Compréhension', 'Progression'],
  },
  {
    icon: Building,
    title: 'Entreprise',
    items: ['Soutien décisionnel', 'Cohérence globale', 'Valorisation'],
  },
];

export const ValuesSection = () => {
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
        <div className="gold-line mb-12"></div>
        <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">Valeurs</p>
        <h2 className="text-3xl md:text-4xl font-bold italic mb-12">
          Ce que nous <span className="text-gold">apportons</span>
        </h2>

        <div className="grid md:grid-cols-2 gap-12">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.title}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-gold" />
                  <h3 className="text-lg font-bold italic">{value.title}</h3>
                </div>
                <ul className="space-y-2 text-sm font-light text-foreground/60">
                  {value.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="text-gold">—</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
