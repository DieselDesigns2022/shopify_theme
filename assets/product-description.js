(function () {
  'use strict';

  function moveProductDescription(scope) {
    var root = scope && scope.querySelectorAll ? scope : document;
    var sections = [];
    var descriptionLabel = 'CLICK HERE FOR FULL PRODUCT DESCRIPTION';

    if (root.matches && root.matches('[data-product-section]')) sections.push(root);
    root.querySelectorAll('[data-product-section]').forEach(function (section) {
      sections.push(section);
    });

    sections.forEach(function (section) {
      var gallery = section.querySelector('[data-product-gallery]');
      var descriptionBlock = section.querySelector('.product-block--description');

      if (!gallery || !descriptionBlock) return;

      var description = descriptionBlock.querySelector('.product-description');
      if (!description) return;

      var details = descriptionBlock.querySelector('.product-gallery__description');

      if (!details) {
        details = document.createElement('details');
        details.className = 'product-collapsible product-gallery__description';

        var summary = document.createElement('summary');
        summary.textContent = descriptionLabel;

        details.appendChild(summary);
        details.appendChild(description);
        descriptionBlock.replaceChildren(details);
      } else {
        var existingSummary = details.querySelector('summary');
        if (existingSummary) existingSummary.textContent = descriptionLabel;
      }

      descriptionBlock.classList.add('product-gallery__description-block');

      var modal = gallery.querySelector('[data-product-modal]');
      if (descriptionBlock.parentElement !== gallery) {
        gallery.insertBefore(descriptionBlock, modal || null);
      }
    });
  }

  moveProductDescription(document);
  document.addEventListener('DOMContentLoaded', function () {
    moveProductDescription(document);
  });
  document.addEventListener('shopify:section:load', function (event) {
    moveProductDescription(event.target);
  });
  document.addEventListener('shopify:block:select', function () {
    moveProductDescription(document);
  });
})();