(function () {
  'use strict';

  if (window.location.pathname !== '/') return;

  var LINK_TEXT = 'MasterClasse : L’Art de Transmettre';
  var LINK_HREF = '/l-art-de-transmettre';

  function addNavigationLinks() {
    var solutionsLink = Array.prototype.slice.call(
      document.querySelectorAll('a, button')
    ).find(function (element) {
      return element.textContent.trim() === 'Solutions';
    });
    if (!solutionsLink || !solutionsLink.parentElement ||
        solutionsLink.parentElement.querySelector('a[data-transmission-nav]')) {
      return;
    }

    var link = document.createElement('a');
    link.href = LINK_HREF;
    link.textContent = LINK_TEXT;
    link.dataset.transmissionNav = 'true';
    link.className = solutionsLink.className;
    link.setAttribute('aria-label', LINK_TEXT);
    solutionsLink.parentElement.insertBefore(link, solutionsLink.nextSibling);
  }

  function addMobileNavigationLink() {
    var menuButton = document.querySelector('button[aria-label="Menu"]');
    var nav = menuButton && menuButton.closest('nav');
    var mobileMenu = nav && nav.nextElementSibling;
    var mobileMenuList = mobileMenu && mobileMenu.querySelector('.flex.flex-col');

    if (!mobileMenuList || mobileMenuList.querySelector('a[data-transmission-mobile-nav]')) {
      return;
    }

    var referenceButton = Array.prototype.slice.call(
      mobileMenuList.querySelectorAll('button')
    ).find(function (element) {
      return element.textContent.trim() === 'Solutions';
    }) || mobileMenuList.querySelector('button');

    if (!referenceButton) return;

    var link = document.createElement('a');
    link.href = LINK_HREF;
    link.textContent = LINK_TEXT;
    link.dataset.transmissionMobileNav = 'true';
    link.className = referenceButton.className;
    link.setAttribute('aria-label', LINK_TEXT);
    referenceButton.insertAdjacentElement('afterend', link);
  }

  function addSolutionCard() {
    var offers = document.getElementById('offres');
    if (!offers || offers.querySelector('[data-transmission-card]')) return;

    var grid = offers.querySelector('.grid');
    var referenceCard = grid && grid.firstElementChild;
    if (!grid || !referenceCard) return;

    var card = document.createElement('a');
    card.href = LINK_HREF;
    card.dataset.transmissionCard = 'true';
    card.className = referenceCard.className;
    card.setAttribute('aria-label', LINK_TEXT);
    card.innerHTML =
      '<div class="mb-8 h-24 flex items-center justify-center">' +
        '<svg viewBox="0 0 100 100" class="w-20 h-20 svg-icon" aria-hidden="true">' +
          '<circle cx="50" cy="50" r="34" fill="none" stroke="#F5E090" stroke-width="1.5" opacity=".72"></circle>' +
          '<path d="M28 50c7-18 37-18 44 0M33 64c11 8 23 8 34 0M50 20v60M20 50h60" fill="none" stroke="#F5E090" stroke-width="1.5" opacity=".72"></path>' +
          '<circle cx="50" cy="50" r="5" fill="#F5E090"></circle>' +
        '</svg>' +
      '</div>' +
      '<div class="p-0 flex flex-col h-full">' +
        '<h3 class="text-xl font-semibold mb-4 text-gold">MasterClasse : L’Art de Transmettre</h3>' +
        '<p class="text-foreground/65 leading-relaxed font-light">Transformez votre savoir en une formation claire, vivante et transmissible.</p>' +
        '<span class="mt-8 text-sm font-medium tracking-wider uppercase text-gold">Découvrir la masterclasse →</span>' +
      '</div>';

    grid.appendChild(card);
  }

  function enhance() {
    addNavigationLinks();
    addMobileNavigationLink();
    addSolutionCard();
  }

  enhance();
  var observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
})();