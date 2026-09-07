(function () {
  var page = window.location.pathname.replace(/\/+$/, '') || '/';
  if (page !== '/edouard') return;

  var H1_TEXT = 'Édouard – Consultant IA pour la viabilité de votre projet business';
  var CARD_HEADINGS = ['DIAGNOSTIC DE STRUCTURE', 'ANALYSE DES FLUX'];

  function replaceHeading(element, tagName) {
    var replacement = document.createElement(tagName);
    Array.prototype.forEach.call(element.attributes, function (attribute) {
      replacement.setAttribute(attribute.name, attribute.value);
    });
    replacement.innerHTML = element.innerHTML;
    element.parentNode.replaceChild(replacement, element);
  }

  function enhanceEdouardPage() {
    var h1 = document.querySelector('h1');
    if (h1 && h1.textContent.trim() !== H1_TEXT) h1.textContent = H1_TEXT;

    document.querySelectorAll('h3').forEach(function (heading) {
      if (CARD_HEADINGS.indexOf(heading.textContent.trim().toUpperCase()) !== -1) {
        replaceHeading(heading, 'h2');
      }
    });

    var footer = document.querySelector('footer');
    if (footer && !footer.querySelector('a[href="https://eugene-majordome.ch/"]')) {
      var firstFooterLink = footer.querySelector('a');
      if (firstFooterLink && firstFooterLink.parentNode) {
        var separator = document.createElement('span');
        separator.className = 'text-white/20';
        separator.textContent = '|';

        var eugeneLink = document.createElement('a');
        eugeneLink.href = 'https://eugene-majordome.ch/';
        eugeneLink.className = firstFooterLink.className;
        eugeneLink.textContent = 'Vous êtes formateur ? Découvrez Eugène, votre majordome pédagogique.';

        firstFooterLink.parentNode.appendChild(separator);
        firstFooterLink.parentNode.appendChild(eugeneLink);
      }
    }
  }

  enhanceEdouardPage();
  var observer = new MutationObserver(enhanceEdouardPage);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();