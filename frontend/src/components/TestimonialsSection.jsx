import React, { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';

const clients = [
  {
    name: 'Hilton Conférence Center Geneva',
    url: 'https://www.hilton.com/en/hotels/gvacchi-hilton-geneva-hotel-and-conference-centre/',
  },
  {
    name: 'Win Sport School Geneva',
    url: 'https://www.win-sport-school.com/ecole-sport-geneve',
  },
  {
    name: 'Company Cup',
    url: 'https://www.company-cup.fr',
  },
  {
    name: 'Sportsvision.lu',
    url: 'https://www.sportsvision.lu',
  },
  {
    name: 'David Lloyd Club Geneva',
    url: 'https://www.davidlloyd.ch/fr-ch/clubs/country-club-geneva/',
  },
];

export const TestimonialsSection = () => {
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
      id="testimonials"
      ref={sectionRef}
      className="w-full py-28 px-6"
      style={{ background: 'hsl(45 86% 76% / 0.015)' }}
    >
      <div className="max-w-5xl mx-auto text-center fade-up">
        <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">Références</p>
        <h2 className="text-3xl md:text-4xl font-bold italic mb-12">
          Ils nous ont fait <span className="text-gold">confiance</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <a
              key={client.name}
              href={client.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-24 border border-foreground/8 rounded-sm relative overflow-hidden group hover:border-foreground/20 transition-all duration-300 px-4"
            >
              <span className="text-sm font-light text-center text-foreground/50 group-hover:text-foreground/70 transition flex items-center gap-2">
                {client.name}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 transition" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
