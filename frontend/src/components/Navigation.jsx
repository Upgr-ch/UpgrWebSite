import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';

export const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('accueil');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);

      // Update active section based on scroll position
      const sections = ['accueil', 'positionnement', 'offres', 'eugene', 'academy', 'testimonials', 'contact'];
      const current = sections.find((section) => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });

      if (current) {
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { type: 'anchor', href: '#accueil', label: 'Accueil' },
    { type: 'anchor', href: '#positionnement', label: 'Notre mission' },
    { type: 'anchor', href: '#offres', label: 'Solutions' },
    { type: 'anchor', href: '#eugene', label: 'Eugène Majordome Pédagogique' },
    { type: 'route', to: '/edouard', label: 'Édouard', activeKey: 'edouard' },
    { type: 'anchor', href: '#academy', label: 'Edouard Consultant' },
    { type: 'anchor', href: '#testimonials', label: 'Ils parlent de nous' },
    { type: 'anchor', href: '#contact', label: 'Contact' },
  ];

  const handleNavClick = (link) => {
    setIsMobileMenuOpen(false);
    if (link.type === 'route') {
      navigate(link.to);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (location.pathname !== '/') {
      navigate('/' + link.href);
      return;
    }
    const element = document.querySelector(link.href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isLinkActive = (link) => {
    if (link.type === 'route') {
      return location.pathname === link.to;
    }
    return location.pathname === '/' && activeSection === link.href.substring(1);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          isScrolled ? 'bg-midnight/95 backdrop-blur-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm tracking-wide">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className={`nav-link text-foreground/70 hover:text-foreground transition ${
                  isLinkActive(link) ? 'active' : ''
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground/70 hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-14 left-0 w-full bg-midnight/98 backdrop-blur-lg border-b border-foreground/10 z-40 md:hidden animate-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link)}
                className="px-6 py-3.5 text-sm font-light text-foreground/75 border-b border-foreground/5 hover:text-gold hover:bg-foreground/5 transition text-left tracking-wider"
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
