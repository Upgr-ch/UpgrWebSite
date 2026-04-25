import React from 'react';

const footerLinks = [
  { label: 'Politique de cookies', href: '#' },
  { label: 'Politique de confidentialité', href: '#' },
  { label: 'Mentions légales', href: '#' },
  { label: 'CVG', href: '#' },
  { label: 'CGU', href: '#' },
];

export const Footer = () => {
  return (
    <footer className="w-full py-10 px-6 border-t border-foreground/5">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-foreground/30 mb-6">
          {footerLinks.map((link, index) => (
            <React.Fragment key={link.label}>
              <a
                href={link.href}
                className="hover:text-foreground/60 transition"
                onClick={(e) => e.preventDefault()}
              >
                {link.label}
              </a>
              {index < footerLinks.length - 1 && <span>|</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="text-center text-xs text-gold">
          © Kévin Lavergne | UpGrade | 2015 - 2026 | Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};
