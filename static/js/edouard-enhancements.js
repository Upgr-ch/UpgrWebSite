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

  function createLeadMagnet() {
    var section = document.createElement('section');
    section.id = 'edouard-lead-magnet';
    section.setAttribute('aria-labelledby', 'edouard-lead-title');
    section.innerHTML =
      '<div class="lead-inner">' +
        '<h2 id="edouard-lead-title">Recevez votre diagnostic complet par email</h2>' +
        '<p class="lead-description">Obtenez une synthèse personnalisée de votre diagnostic business, directement dans votre boîte mail.</p>' +
        '<form id="edouard-lead-form">' +
          '<label class="lead-honeypot" aria-hidden="true">Site web<input name="website" tabindex="-1" autocomplete="off"></label>' +
          '<label class="sr-only" for="edouard-lead-email">Votre adresse email</label>' +
          '<input id="edouard-lead-email" name="email" type="email" autocomplete="email" placeholder="Votre adresse email" required>' +
          '<button type="submit">Recevoir mon diagnostic</button>' +
        '</form>' +
        '<p id="edouard-lead-status" role="status" aria-live="polite"></p>' +
        '<a class="eugene-link" href="https://eugene-majordome.ch/">Vous êtes formateur ? Découvrez Eugène, votre majordome pédagogique.</a>' +
      '</div>';

    section.querySelector('form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var form = event.currentTarget;
      var emailInput = form.querySelector('input[name="email"]');
      var button = form.querySelector('button');
      var status = section.querySelector('#edouard-lead-status');
      var originalLabel = button.textContent;

      if (!emailInput.reportValidity()) return;

      button.disabled = true;
      button.textContent = 'Envoi en cours…';
      status.textContent = '';

      try {
        var response = await fetch('/api/leads/edouard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.value,
            website: form.querySelector('input[name="website"]').value
          })
        });
        if (!response.ok) throw new Error('capture_failed');

        form.reset();
        status.textContent = 'Merci. Votre adresse a bien été enregistrée.';
      } catch (error) {
        status.textContent = 'L’enregistrement est momentanément indisponible. Veuillez réessayer.';
      } finally {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    });

    return section;
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
    if (footer && !document.getElementById('edouard-lead-magnet')) {
      footer.parentNode.insertBefore(createLeadMagnet(), footer);
    }
  }

  enhanceEdouardPage();
  var observer = new MutationObserver(enhanceEdouardPage);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();