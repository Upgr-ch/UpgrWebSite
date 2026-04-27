import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Zap, Award, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const benefits = [
  {
    icon: Zap,
    title: 'Gain de temps et clarification',
    description:
      "Passez de l'idée au plan structuré en 30 minutes au lieu de plusieurs jours.",
    gradient: 'from-gold/20 to-gold-deep/10',
  },
  {
    icon: Award,
    title: 'Zéro base pédagogique',
    description:
      "Eugène s'occupe de la structure prête à accueillir votre savoir.",
    gradient: 'from-gold-deep/20 to-gold/10',
  },
  {
    icon: Sparkles,
    title: 'Créez à la vitesse de la pensée',
    description:
      "Eugène supprime l'inertie entre votre idée et sa réalisation.",
    gradient: 'from-gold/20 to-gold-deep/10',
  },
];

const footerLinks = [
  { label: 'Politique de cookies', href: '#' },
  { label: 'Politique de confidentialité', href: '#' },
  { label: 'Mentions légales', href: '#' },
  { label: 'CVG', href: '#' },
  { label: 'CGU', href: '#' },
];

export const EugeneLanding = () => {
  useEffect(() => {
    document.title = 'Eugène — Majordome Pédagogique | UpGrade';
  }, []);
  return (
    <div
      className="min-h-screen text-white font-raleway"
      style={{ backgroundColor: '#080F1E' }}
    >
      {/* Header (synchronisé avec Édouard) */}
      <header
        className="fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b border-white/5"
        style={{ backgroundColor: 'rgba(8, 15, 30, 0.85)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-xs md:text-sm font-light tracking-widest uppercase text-white/90 hover:text-[#F5E090] transition"
          >
            EUGÈNE — MAJORDOME PÉDAGOGIQUE
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-xs tracking-wider uppercase">
            <Link
              to="/"
              className="text-white/70 hover:text-[#F5E090] transition"
            >
              Accueil
            </Link>
            <Link
              to="/eugene"
              className="text-[#F5E090] transition"
            >
              Eugène
            </Link>
            <Link
              to="/edouard"
              className="text-white/70 hover:text-[#F5E090] transition"
            >
              Édouard
            </Link>
          </nav>
          <Button
            asChild
            variant="ghost"
            className="text-[#F5E090] hover:text-white hover:bg-[#F5E090]/10 transition-all text-sm font-light tracking-wide"
          >
            <a
              href="https://eugene-majordome.ch/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Accéder à Eugène
            </a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background decorative elements */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse at 20% 30%, hsl(45 86% 76% / 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 60%, hsl(43 65% 43% / 0.06) 0%, transparent 50%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-left">
              <Badge
                variant="outline"
                className="mb-6 border-gold/30 text-gold-deep px-4 py-1.5 text-xs tracking-wider"
              >
                <Clock className="w-3 h-3 mr-2" />
                STRUCTUREZ EN MOINS D'UNE HEURE
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="shimmer-text">Structurez votre savoir</span>
                <br />
                <span className="text-gold">en moins d'une heure.</span>
              </h1>

              <h2
                className="eugene-fade-in font-raleway text-lg md:text-xl font-light leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0"
                style={{ color: '#FFFFFF', opacity: 0.85, animationDelay: '0.15s' }}
              >
                Eugène, votre majordome pédagogique vous guide pour créer votre plan de formation,{' '}
                <span className="italic" style={{ color: '#F5E090' }}>
                  même si vous n'avez aucune base en pédagogie.
                </span>
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                <Button
                  asChild
                  size="lg"
                  className="bg-gold hover:bg-gold-glow text-midnight font-medium px-8 py-6 text-base shadow-lg shadow-gold/20 transition-all hover:shadow-xl hover:shadow-gold/30 hover:scale-105"
                >
                  <a
                    href="https://eugene-majordome.ch/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Essayer Eugène gratuitement
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-4 text-sm text-foreground/50">
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  Gratuit
                </span>
                <span className="text-foreground/20">·</span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  Sans carte bancaire
                </span>
                <span className="text-foreground/20">·</span>
                <span className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                  Résultat immédiat
                </span>
              </div>
            </div>

            {/* Avatar */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                {/* Decorative rings */}
                <div className="absolute inset-0 animate-pulse">
                  <div className="absolute inset-0 rounded-full border-2 border-gold/20 scale-110" />
                  <div className="absolute inset-0 rounded-full border border-gold/10 scale-125" />
                </div>
                
                {/* Avatar Image */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/20 to-gold-deep/10 blur-2xl" />
                  <img
                    src="https://customer-assets.emergentagent.com/job_pedagogy-majordome/artifacts/bg83u0ta_Euge%CC%80neV2.png"
                    alt="Eugène - Majordome Pédagogique"
                    className="relative w-full h-full object-cover rounded-full border-4 border-gold/30 shadow-2xl shadow-gold/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-foreground/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card
                  key={benefit.title}
                  className="eugene-fade-in font-raleway bg-midnight border-foreground/10 hover:border-gold/30 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10 hover:-translate-y-1"
                  style={{
                    backgroundColor: '#080F1E',
                    animationDelay: `${index * 0.18}s`,
                  }}
                >
                  <CardContent className="p-8">
                    <div
                      className={`w-14 h-14 rounded-lg bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mb-6`}
                    >
                      <Icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="text-xl font-bold mb-4" style={{ color: '#FFFFFF' }}>
                      {benefit.title}
                    </h3>
                    <p className="leading-relaxed font-light" style={{ color: '#FFFFFF', opacity: 0.75 }}>
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer with Glassmorphism */}
      <footer className="mt-20 py-8 px-6 bg-midnight/70 backdrop-blur-lg border-t border-foreground/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-foreground/40 mb-6">
            {footerLinks.map((link, index) => (
              <React.Fragment key={link.label}>
                <a
                  href={link.href}
                  className="hover:text-gold-deep transition"
                  onClick={(e) => e.preventDefault()}
                >
                  {link.label}
                </a>
                {index < footerLinks.length - 1 && <span className="text-foreground/20">|</span>}
              </React.Fragment>
            ))}
          </div>
          <div className="text-center text-xs text-gold-deep/80">
            © Kévin Lavergne I UpGrade I 2015 - 2026
          </div>
        </div>
      </footer>
    </div>
  );
};
