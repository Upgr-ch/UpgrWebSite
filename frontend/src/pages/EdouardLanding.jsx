import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  Layers,
  ListChecks,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const pillars = [
  {
    icon: Layers,
    title: 'DIAGNOSTIC DE STRUCTURE',
    description:
      "Identifier les failles d'un projet avant l'exécution pour éviter l'échec financier et la perte de temps.",
  },
  {
    icon: Activity,
    title: 'ANALYSE DES FLUX',
    description:
      "Audit complet du projet à partir de l'idée à travers le prisme de la réalité du Marché, de la Structure et des Moyens.",
  },
];

const methodologyHighlights = [
  'Confrontation aux réalités économiques',
  'Audit data-driven',
  'Diagnostic confidentiel',
];

const footerLinks = [
  { label: 'Politique de cookies', href: '#' },
  { label: 'Politique de confidentialité', href: '#' },
  { label: 'Mentions légales', href: '#' },
  { label: 'CVG', href: '#' },
  { label: 'CGU', href: '#' },
];

const BrainLogo = () => (
  <svg
    viewBox="0 0 240 240"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F5E090" stopOpacity="0.18" />
        <stop offset="60%" stopColor="#F5E090" stopOpacity="0.05" />
        <stop offset="100%" stopColor="#F5E090" stopOpacity="0" />
      </radialGradient>
    </defs>
    <circle cx="120" cy="120" r="110" fill="url(#brainGlow)" />
    <g
      fill="none"
      stroke="#F5E090"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Outer brain shape */}
      <path
        d="M120 28 C 74 28, 42 62, 42 108 C 42 132, 50 152, 64 168 C 70 196, 96 214, 120 214 C 144 214, 170 196, 176 168 C 190 152, 198 132, 198 108 C 198 62, 166 28, 120 28 Z"
        opacity="0.85"
      />
      {/* Center division */}
      <path d="M120 32 L120 210" opacity="0.45" strokeDasharray="3 4" />
      {/* Left hemisphere convolutions */}
      <path d="M85 58 Q 66 78, 78 100 T 70 142 T 90 178" opacity="0.85" />
      <path d="M62 92 Q 80 102, 74 122 T 92 154" opacity="0.7" />
      <path d="M104 64 Q 96 90, 108 112 T 96 148 T 108 184" opacity="0.75" />
      {/* Right hemisphere convolutions */}
      <path d="M155 58 Q 174 78, 162 100 T 170 142 T 150 178" opacity="0.85" />
      <path d="M178 92 Q 160 102, 166 122 T 148 154" opacity="0.7" />
      <path d="M136 64 Q 144 90, 132 112 T 144 148 T 132 184" opacity="0.75" />
      {/* Neural nodes */}
      <circle cx="80" cy="100" r="2.2" fill="#F5E090" />
      <circle cx="160" cy="100" r="2.2" fill="#F5E090" />
      <circle cx="105" cy="130" r="2.2" fill="#F5E090" />
      <circle cx="135" cy="130" r="2.2" fill="#F5E090" />
      <circle cx="92" cy="162" r="2" fill="#F5E090" />
      <circle cx="148" cy="162" r="2" fill="#F5E090" />
      <circle cx="120" cy="180" r="2" fill="#F5E090" />
    </g>
  </svg>
);

export const EdouardLanding = () => {
  return (
    <div
      className="min-h-screen text-white font-raleway"
      style={{ backgroundColor: '#080F1E' }}
    >
      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b border-white/5"
        style={{ backgroundColor: 'rgba(8, 15, 30, 0.85)' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="text-xs md:text-sm font-light tracking-widest uppercase text-white/90 hover:text-[#F5E090] transition"
          >
            ÉDOUARD — CONSULTANT EN FAISABILITÉ
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
              className="text-white/70 hover:text-[#F5E090] transition"
            >
              Eugène
            </Link>
            <Link
              to="/edouard"
              className="text-[#F5E090] transition"
            >
              Édouard
            </Link>
          </nav>
          <Button
            variant="ghost"
            className="text-[#F5E090] hover:text-white hover:bg-[#F5E090]/10 transition-all text-sm font-light tracking-wide"
          >
            Accéder à Édouard
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 18% 28%, rgba(245, 224, 144, 0.08) 0%, transparent 55%), radial-gradient(ellipse at 82% 62%, rgba(245, 224, 144, 0.05) 0%, transparent 55%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Text */}
            <div className="flex-1 text-center lg:text-left">
              <Badge
                variant="outline"
                className="mb-6 border-[#F5E090]/30 text-[#F5E090] px-4 py-1.5 text-xs tracking-wider bg-transparent"
              >
                <ShieldCheck className="w-3 h-3 mr-2" />
                ANALYSE DE VIABILITÉ BUSINESS
              </Badge>

              <h1
                className="font-raleway text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight"
                style={{ color: '#F5E090' }}
              >
                ÉDOUARD
                <span className="block text-xl md:text-2xl lg:text-3xl font-light tracking-wide mt-3 text-white/90">
                  — CONSULTANT EN FAISABILITÉ ET RENTABILITÉ DE PROJETS BUSINESS
                </span>
              </h1>

              <p className="text-lg md:text-xl font-light leading-relaxed text-white/75 mb-8 max-w-2xl mx-auto lg:mx-0">
                Édouard confronte chaque idée aux réalités économiques. Il
                analyse les données pour évaluer la viabilité d'un projet{' '}
                <span className="italic" style={{ color: '#F5E090' }}>
                  avant son déploiement.
                </span>
              </p>

              <p className="text-sm md:text-base font-light text-white/55 mb-10 max-w-2xl mx-auto lg:mx-0">
                Conçu pour les entrepreneurs, slasheurs et porteurs de projets
                qui veulent un diagnostic assertif sur la viabilité et la
                rentabilité de leurs idées avant leur mise en œuvre.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-6">
                <Button
                  size="lg"
                  className="font-medium px-8 py-6 text-base shadow-lg transition-all hover:scale-105"
                  style={{
                    backgroundColor: '#F5E090',
                    color: '#080F1E',
                    boxShadow: '0 10px 30px -10px rgba(245, 224, 144, 0.4)',
                  }}
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Essayer Édouard gratuitement
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-sm text-white/55">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#F5E090' }}
                  />
                  Sans carte bancaire
                </span>
                <span className="text-white/25">·</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#F5E090' }}
                  />
                  Accès immédiat
                </span>
                <span className="text-white/25">·</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: '#F5E090' }}
                  />
                  Diagnostic confidentiel
                </span>
              </div>
            </div>

            {/* Brain logo with laser scan */}
            <div className="flex-1 flex items-center justify-center">
              <div
                className="relative w-64 h-64 md:w-80 md:h-80 lg:w-[26rem] lg:h-[26rem] rounded-full overflow-hidden"
                style={{
                  boxShadow:
                    'inset 0 0 60px rgba(245, 224, 144, 0.08), 0 0 80px rgba(245, 224, 144, 0.08)',
                  border: '1px solid rgba(245, 224, 144, 0.18)',
                }}
              >
                {/* Decorative outer rings */}
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="absolute inset-3 rounded-full border"
                    style={{ borderColor: 'rgba(245, 224, 144, 0.12)' }}
                  />
                  <div
                    className="absolute inset-8 rounded-full border"
                    style={{ borderColor: 'rgba(245, 224, 144, 0.08)' }}
                  />
                </div>

                {/* Brain SVG */}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <BrainLogo />
                </div>

                {/* Laser scan line */}
                <div className="edouard-laser-scan" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section
        className="py-20 px-6"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgba(255,255,255,0.02), transparent)',
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-xs tracking-[0.35em] uppercase mb-3"
              style={{ color: '#F5E090' }}
            >
              Les Piliers
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Une lecture chirurgicale de votre projet.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card
                  key={pillar.title}
                  className="border-white/10 transition-all duration-300 hover:-translate-y-1"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <CardContent className="p-8">
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center mb-6"
                      style={{
                        backgroundColor: 'rgba(245, 224, 144, 0.12)',
                        border: '1px solid rgba(245, 224, 144, 0.25)',
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: '#F5E090' }} />
                    </div>
                    <h3
                      className="text-lg font-bold mb-4 tracking-wider"
                      style={{ color: '#F5E090' }}
                    >
                      {pillar.title}
                    </h3>
                    <p className="text-white/65 leading-relaxed font-light">
                      {pillar.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p
            className="text-xs tracking-[0.35em] uppercase mb-3"
            style={{ color: '#F5E090' }}
          >
            Méthodologie
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-6 tracking-tight"
            style={{ color: '#F5E090' }}
          >
            LE VERDICT EN 10 ÉTAPES
          </h2>
          <p className="text-base md:text-lg font-light text-white/70 leading-relaxed mb-10">
            Un parcours de qualification exigeant pour établir un indice de
            faisabilité final.
          </p>

          <div className="flex items-center justify-center mb-12">
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-w-2xl">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                    style={{
                      border: '1px solid rgba(245, 224, 144, 0.4)',
                      color: '#F5E090',
                      backgroundColor: 'rgba(245, 224, 144, 0.04)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <ListChecks
                    className="w-3 h-3 opacity-50"
                    style={{ color: '#F5E090' }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/55 tracking-wider uppercase">
            {methodologyHighlights.map((h) => (
              <span key={h} className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: '#F5E090' }}
                />
                {h}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-6">
        <div
          className="max-w-3xl mx-auto text-center rounded-2xl px-8 py-14"
          style={{
            border: '1px solid rgba(245, 224, 144, 0.18)',
            background:
              'linear-gradient(180deg, rgba(245, 224, 144, 0.04) 0%, rgba(245, 224, 144, 0) 100%)',
          }}
        >
          <p className="text-sm font-light text-white/70 mb-6 italic">
            « Édouard confronte les utilisateurs. Il est ferme, assertif et
            juste. »
          </p>
          <Button
            size="lg"
            className="font-medium px-8 py-6 text-base shadow-lg transition-all hover:scale-105"
            style={{
              backgroundColor: '#F5E090',
              color: '#080F1E',
              boxShadow: '0 10px 30px -10px rgba(245, 224, 144, 0.4)',
            }}
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Essayer Édouard gratuitement
          </Button>
          <p className="mt-4 text-xs text-white/50">
            Sans carte bancaire · Accès immédiat · Diagnostic confidentiel
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="mt-12 py-8 px-6 border-t border-white/5"
        style={{ backgroundColor: 'rgba(8, 15, 30, 0.7)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/40 mb-6">
            {footerLinks.map((link, index) => (
              <React.Fragment key={link.label}>
                <a
                  href={link.href}
                  className="hover:text-[#F5E090] transition"
                  onClick={(e) => e.preventDefault()}
                >
                  {link.label}
                </a>
                {index < footerLinks.length - 1 && (
                  <span className="text-white/20">|</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <div
            className="text-center text-xs"
            style={{ color: 'rgba(245, 224, 144, 0.8)' }}
          >
            © Kévin Lavergne I UpGrade I 2015 - 2026
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EdouardLanding;
