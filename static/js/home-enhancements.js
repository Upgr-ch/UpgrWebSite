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
    if (!mobileMenu ||
        !mobileMenu.classList.contains('fixed') ||
        !mobileMenu.classList.contains('md:hidden')) {
      return;
    }

    var mobileMenuList = mobileMenu && mobileMenu.querySelector('.flex.flex-col');

    if (!mobileMenuList || mobileMenuList.querySelector('a[data-transmission-mobile-nav]')) {
      return;
    }

    var referenceButton = Array.prototype.slice.call(
      mobileMenuList.querySelectorAll('button')
    ).find(function (element) {
      return element.textContent.trim() === 'Solutions';
    });

    if (!referenceButton) return;

    var link = document.createElement('a');
    link.href = LINK_HREF;
    link.textContent = LINK_TEXT;
    link.dataset.transmissionMobileNav = 'true';
    link.className = referenceButton.className;
    link.setAttribute('aria-label', LINK_TEXT);
    referenceButton.insertAdjacentElement('afterend', link);
  }

  function enhance() {
    addNavigationLinks();
    addMobileNavigationLink();
  }

  enhance();
  var observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
})();