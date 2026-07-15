(function () {
  'use strict';

  var selectors = {
    header: '[data-header-section]',
    trigger: '[data-mobile-menu-trigger]',
    menu: '[data-mobile-menu]',
    close: '[data-mobile-menu-close]',
    overlay: '[data-mobile-menu-overlay]',
    reveal: '.banner, .rich-text, .main-404',
    focusable: 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  };

  var revealObserver = null;

  function getFocusable(container) {
    if (!container) return [];
    return Array.prototype.slice.call(container.querySelectorAll(selectors.focusable)).filter(function (element) {
      return element.offsetParent !== null || element === document.activeElement;
    });
  }

  function initHeader(header) {
    if (!header || header.dataset.mobileReady === 'true') return;
    var trigger = header.querySelector(selectors.trigger);
    var menu = header.querySelector(selectors.menu);
    var close = header.querySelector(selectors.close);
    var overlay = header.querySelector(selectors.overlay);
    if (!trigger || !menu || !overlay) return;

    header.dataset.mobileReady = 'true';
    var lastTrigger = null;

    function openMenu() {
      lastTrigger = document.activeElement;
      menu.hidden = false;
      overlay.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-menu-open');
      var focusable = getFocusable(menu);
      if (focusable.length) focusable[0].focus();
    }

    function closeMenu(options) {
      if (menu.hidden) return;
      menu.hidden = true;
      overlay.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
      if (!options || options.returnFocus !== false) {
        if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
      }
    }

    function handleKeydown(event) {
      if (menu.hidden) return;
      if (event.key === 'Escape') {
        closeMenu();
        return;
      }
      if (event.key !== 'Tab') return;
      var focusable = getFocusable(menu);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    trigger.addEventListener('click', function () {
      if (menu.hidden) openMenu(); else closeMenu();
    });
    if (close) close.addEventListener('click', function () { closeMenu(); });
    overlay.addEventListener('click', function () { closeMenu(); });
    header.addEventListener('keydown', handleKeydown);
  }

  function showRevealItems() {
    document.querySelectorAll('.reveal-ready').forEach(function (item) {
      item.classList.remove('reveal-ready');
      item.classList.add('reveal-visible');
    });
  }

  function canReveal() {
    if (!document.body || document.body.dataset.revealAnimation !== 'true') return false;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return 'IntersectionObserver' in window;
  }

  function getRevealObserver() {
    if (!canReveal()) {
      if (revealObserver) {
        revealObserver.disconnect();
        revealObserver = null;
      }
      showRevealItems();
      return null;
    }
    if (revealObserver) return revealObserver;

    revealObserver = new IntersectionObserver(function (entries, activeObserver) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          activeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    return revealObserver;
  }

  function initReveal(scope) {
    var observer = getRevealObserver();
    if (!observer) return;
    var root = scope || document;
    var items = Array.prototype.slice.call(root.querySelectorAll(selectors.reveal));
    if (root !== document && root.matches && root.matches(selectors.reveal)) items.unshift(root);
    items.filter(function (item) {
      return item.dataset.revealReady !== 'true';
    }).forEach(function (item) {
      item.dataset.revealReady = 'true';
      item.classList.add('reveal-ready');
      observer.observe(item);
    });
  }

  function init(scope) {
    var root = scope || document;
    if (root !== document && root.matches && root.matches(selectors.header)) initHeader(root);
    root.querySelectorAll(selectors.header).forEach(initHeader);
    initReveal(root);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);

  document.addEventListener('shopify:section:load', function (event) {
    if (event && event.target) init(event.target);
  });

  document.addEventListener('shopify:section:unload', function (event) {
    if (!event || !event.target) return;
    if (event.target.matches && event.target.matches(selectors.header)) document.body.classList.remove('mobile-menu-open');
    else if (event.target.querySelector(selectors.header)) document.body.classList.remove('mobile-menu-open');

    if (revealObserver) {
      var revealItems = Array.prototype.slice.call(event.target.querySelectorAll(selectors.reveal));
      if (event.target.matches && event.target.matches(selectors.reveal)) revealItems.unshift(event.target);
      revealItems.forEach(function (item) {
        revealObserver.unobserve(item);
      });
    }
  });
}());
