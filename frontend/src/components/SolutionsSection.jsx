import React, { useEffect, useRef } from 'react';
import { Search, Layers, RefreshCw, Users } from 'lucide-react';
import { Card, CardContent } from './ui/card';

const solutions = [
  {
    id: 'insight',
    icon: Search,
    title: 'UpGrade Insight',
    description:
      "Audit de vos dispositifs de L&D pour appréhender ce qui fonctionne, ce qui manque et ce qui peut être amélioré. Vision de l'existant et éléments prioritaires à faire évoluer.",
    gradientId: 'insightGrad',
    svgContent: (
      <>
        <circle cx="50" cy="50" r="38" fill="none" stroke="url(#insightGrad)" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="hsl(45 86% 76%)" strokeWidth="0.8" opacity="0.3" />
        <g opacity="0.5" stroke="hsl(45 86% 76%)" strokeWidth="1">
          <line x1="50" y1="20" x2="50" y2="30" />
          <line x1="50" y1="70" x2="50" y2="80" />
          <line x1="20" y1="50" x2="30" y2="50" />
          <line x1="70" y1="50" x2="80" y2="50" />
          <line x1="32" y1="32" x2="38" y2="38" />
          <line x1="62" y1="62" x2="68" y2="68" />
        </g>
        <circle cx="50" cy="50" r="5" fill="hsl(45 86% 76%)" opacity="0.7" />
      </>
    ),
  },
  {
    id: 'transform',
    icon: Layers,
    title: 'UpGrade Transform',
    description:
      "Conception et structuration des dispositifs L&D. À partir du diagnostic d'audit, nous définissons des parcours qui répondent aux besoins des collaborateurs et aux objectifs de l'entreprise.",
    gradientId: 'transformGrad',
    svgContent: (
      <>
        <g opacity="0.5" stroke="url(#transformGrad)" strokeWidth="1.5" fill="none">
          <rect x="25" y="20" width="50" height="20" rx="2" />
          <rect x="20" y="50" width="60" height="20" rx="2" />
          <rect x="15" y="80" width="70" height="12" rx="2" />
        </g>
        <line x1="55" y1="40" x2="55" y2="50" stroke="hsl(45 86% 76%)" strokeWidth="1" opacity="0.7" />
        <line x1="55" y1="70" x2="55" y2="80" stroke="hsl(45 86% 76%)" strokeWidth="1" opacity="0.7" />
        <circle cx="55" cy="45" r="3" fill="hsl(45 86% 76%)" opacity="0.6" />
        <circle cx="55" cy="75" r="3" fill="hsl(45 86% 76%)" opacity="0.6" />
      </>
    ),
  },
  {
    id: 'continuum',
    icon: RefreshCw,
    title: 'UpGrade Continuum',
    description:
      "Suivi et pilotage des dispositifs L&D dans le temps. Points d'ajustement pour garantir cohérence et efficacité.",
    gradientId: 'continuumGrad',
    svgContent: (
      <>
        <circle cx="50" cy="50" r="35" fill="none" stroke="url(#continuumGrad)" strokeWidth="2" />
        <path
          d="M 50 20 A 30 30 0 0 1 75 55"
          fill="none"
          stroke="hsl(45 86% 76%)"
          strokeWidth="2.5"
          opacity="0.8"
        />
        <path
          d="M 75 55 A 30 30 0 0 1 35 75"
          fill="none"
          stroke="hsl(45 86% 76%)"
          strokeWidth="2"
          opacity="0.6"
        />
        <path
          d="M 35 75 A 30 30 0 0 1 50 20"
          fill="none"
          stroke="hsl(45 86% 76%)"
          strokeWidth="1.5"
          opacity="0.4"
          strokeDasharray="3,2"
        />
        <circle cx="50" cy="20" r="3" fill="hsl(45 86% 76%)" />
      </>
    ),
  },
  {
    id: 'sourcing',
    icon: Users,
    title: 'UpGrade Sourcing',
    description:
      "Gestion des prestataires externes comme éléments intégrés du système L&D. Identification, sélection et suivi des partenaires.",
    gradientId: 'sourcingGrad',
    svgContent: (
      <>
        <circle cx="35" cy="35" r="12" fill="none" stroke="url(#sourcingGrad)" strokeWidth="1.5" />
        <circle cx="65" cy="35" r="12" fill="none" stroke="url(#sourcingGrad)" strokeWidth="1.5" />
        <circle cx="50" cy="65" r="12" fill="none" stroke="url(#sourcingGrad)" strokeWidth="1.5" />
        <line x1="43" y1="40" x2="57" y2="60" stroke="hsl(45 86% 76%)" strokeWidth="1" opacity="0.5" />
        <line x1="57" y1="40" x2="43" y2="60" stroke="hsl(45 86% 76%)" strokeWidth="1" opacity="0.5" />
        <circle cx="35" cy="35" r="3" fill="hsl(45 86% 76%)" opacity="0.8" />
        <circle cx="65" cy="35" r="3" fill="hsl(45 86% 76%)" opacity="0.8" />
        <circle cx="50" cy="65" r="3" fill="hsl(45 86% 76%)" opacity="0.8" />
      </>
    ),
  },
];

export const SolutionsSection = () => {
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
      id="offres"
      ref={sectionRef}
      className="w-full py-28 px-6"
      style={{
        background: 'linear-gradient(180deg, hsl(45 86% 76% / 0.02) 0%, transparent 100%)',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20 fade-up">
          <p className="text-xs tracking-widest-plus uppercase mb-4 text-gold-deep">Solutions</p>
          <h2 className="text-3xl md:text-4xl font-bold italic">
            Solutions <span className="text-gold">UpGrade</span>
          </h2>
        </div>

        {/* Solutions Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            return (
              <Card
                key={solution.id}
                className="card-hover border-foreground/10 bg-surface p-8 fade-up flex flex-col"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-0 flex flex-col h-full">
                  {/* SVG Icon */}
                  <div className="mb-8 h-24 flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-20 h-20 svg-icon">
                      <defs>
                        <linearGradient id={solution.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="hsl(45 86% 76%)" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="hsl(43 65% 43%)" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                      {solution.svgContent}
                    </svg>
                  </div>

                  {/* Title */}
                  <div className="flex items-center gap-3 mb-5">
                    <Icon className="w-5 h-5 text-gold" />
                    <h3 className="text-xl font-bold italic text-gold">{solution.title}</h3>
                  </div>

                  {/* Description */}
                  <p className="text-sm font-light leading-relaxed text-foreground/60">
                    {solution.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
