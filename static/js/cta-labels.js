(function () {
  var page = window.location.pathname.replace(/\/+$/, '') || '/';
  var replacements = {
    '/eugene': {
      from: 'Essayer Eugène gratuitement',
      to: 'Essayez Eugène : Accès Libre, Illimité, Sans paiement.'
    },
    '/edouard': {
      from: 'Essayer Édouard gratuitement',
      to: 'Essayez Édouard : Accès Libre, Illimité, Sans paiement'
    }
  };
  var replacement = replacements[page];

  if (!replacement) return;

  function replaceCtaText() {
    document.querySelectorAll('a').forEach(function (link) {
      link.childNodes.forEach(function (node) {
        if (
          node.nodeType === Node.TEXT_NODE &&
          node.nodeValue.indexOf(replacement.from) !== -1
        ) {
          node.nodeValue = node.nodeValue.replace(replacement.from, replacement.to);
        }
      });
    });
  }

  replaceCtaText();

  var observer = new MutationObserver(replaceCtaText);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();