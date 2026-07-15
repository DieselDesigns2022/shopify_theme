(function () {
  'use strict';

  var selectors = {
    header: '[data-header-section]',
    trigger: '[data-mobile-menu-trigger]',
    menu: '[data-mobile-menu]',
    close: '[data-mobile-menu-close]',
    overlay: '[data-mobile-menu-overlay]',
    reveal: '.banner, .rich-text, .main-404',
    announcement: '[data-announcement-section]',
    focusable: 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  };

  var revealObserver = null;
  var announcementControllers = new WeakMap();
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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


  function storageDismissed(key) {
    if (window.Shopify && window.Shopify.designMode) return false;
    try { return window.sessionStorage.getItem(key) === 'true'; } catch (error) { return false; }
  }

  function setStorageDismissed(key) {
    try { window.sessionStorage.setItem(key, 'true'); } catch (error) { /* Storage is optional. */ }
  }

  function initAnnouncement(section) {
    if (!section || announcementControllers.has(section)) return;
    var style = section.dataset.announcementStyle;
    var count = parseInt(section.dataset.announcementCount, 10) || 0;
    var items = Array.prototype.slice.call(section.querySelectorAll('[data-announcement-item]'));
    if (!count || !items.length) return;

    var sectionId = section.dataset.sectionId || section.id || 'announcement';
    var dismissKey = 'announcement-dismissed-' + sectionId;
    if (section.dataset.dismissible === 'true' && storageDismissed(dismissKey)) {
      section.hidden = true;
      announcementControllers.set(section, function () { announcementControllers.delete(section); });
      return;
    }

    var cleanup = [];
    var timer = null;
    var index = 0;
    var userPaused = false;
    var hoverPaused = false;
    var focusPaused = false;
    var toggle = section.querySelector('[data-announcement-toggle]');
    var dismiss = section.querySelector('[data-announcement-dismiss]');
    var pauseIcon = toggle ? toggle.querySelector('[data-announcement-pause-icon]') : null;
    var playIcon = toggle ? toggle.querySelector('[data-announcement-play-icon]') : null;
    var toggleLabel = toggle ? toggle.querySelector('[data-announcement-toggle-label]') : null;

    function isMotionReduced() {
      return reduceMotion.matches;
    }

    function shouldPause() {
      return userPaused || hoverPaused || focusPaused || isMotionReduced();
    }

    function showItem(nextIndex) {
      items.forEach(function (item, itemIndex) {
        item.hidden = itemIndex !== nextIndex;
      });
      index = nextIndex;
    }

    function stopTimer() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function startTimer() {
      if (style !== 'rotating' || count <= 1 || shouldPause()) return;
      stopTimer();
      timer = window.setInterval(function () {
        if (shouldPause()) { stopTimer(); return; }
        showItem((index + 1) % items.length);
      }, parseInt(section.dataset.rotationSpeed, 10) || 5000);
    }

    function updateToggle() {
      if (!toggle) return;
      var label = userPaused ? toggle.dataset.resumeLabel : toggle.dataset.pauseLabel;
      toggle.setAttribute('aria-label', label);
      toggle.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      if (pauseIcon) pauseIcon.hidden = userPaused;
      if (playIcon) playIcon.hidden = !userPaused;
      if (toggleLabel) toggleLabel.textContent = label;
    }

    function syncMotion() {
      section.classList.toggle('announcement-bar--is-paused', shouldPause());
      if (style === 'rotating') {
        if (shouldPause()) stopTimer(); else startTimer();
      }
    }

    if (style === 'rotating') {
      showItem(0);
      startTimer();
    }

    if (section.dataset.pauseOnHover === 'true') {
      section.dataset.hoverPaused = 'true';
      var onEnter = function () { hoverPaused = true; syncMotion(); };
      var onLeave = function () { hoverPaused = false; syncMotion(); };
      section.addEventListener('mouseenter', onEnter);
      section.addEventListener('mouseleave', onLeave);
      cleanup.push(function () { section.removeEventListener('mouseenter', onEnter); section.removeEventListener('mouseleave', onLeave); });
    }

    var onFocusIn = function () { focusPaused = true; syncMotion(); };
    var onFocusOut = function () { window.setTimeout(function () { focusPaused = section.contains(document.activeElement); syncMotion(); }, 0); };
    section.addEventListener('focusin', onFocusIn);
    section.addEventListener('focusout', onFocusOut);
    cleanup.push(function () { section.removeEventListener('focusin', onFocusIn); section.removeEventListener('focusout', onFocusOut); });

    if (toggle) {
      var onToggle = function () { userPaused = !userPaused; updateToggle(); syncMotion(); };
      toggle.addEventListener('click', onToggle);
      cleanup.push(function () { toggle.removeEventListener('click', onToggle); });
    }

    if (dismiss) {
      var onDismiss = function () {
        section.hidden = true;
        stopTimer();
        if (!(window.Shopify && window.Shopify.designMode)) setStorageDismissed(dismissKey);
      };
      dismiss.addEventListener('click', onDismiss);
      cleanup.push(function () { dismiss.removeEventListener('click', onDismiss); });
    }

    var onMotionChange = function () { syncMotion(); };
    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);
    else if (reduceMotion.addListener) reduceMotion.addListener(onMotionChange);
    cleanup.push(function () {
      if (reduceMotion.removeEventListener) reduceMotion.removeEventListener('change', onMotionChange);
      else if (reduceMotion.removeListener) reduceMotion.removeListener(onMotionChange);
    });

    updateToggle();
    syncMotion();
    announcementControllers.set(section, function () { stopTimer(); cleanup.forEach(function (fn) { fn(); }); announcementControllers.delete(section); });
  }

  function destroyAnnouncements(scope) {
    var root = scope || document;
    var sections = [];
    if (root.matches && root.matches(selectors.announcement)) sections.push(root);
    Array.prototype.slice.call(root.querySelectorAll(selectors.announcement)).forEach(function (section) { sections.push(section); });
    sections.forEach(function (section) {
      var cleanup = announcementControllers.get(section);
      if (cleanup) cleanup();
    });
  }

  function init(scope) {
    var root = scope || document;
    if (root !== document && root.matches && root.matches(selectors.header)) initHeader(root);
    root.querySelectorAll(selectors.header).forEach(initHeader);
    if (root !== document && root.matches && root.matches(selectors.announcement)) initAnnouncement(root);
    root.querySelectorAll(selectors.announcement).forEach(initAnnouncement);
    initReveal(root);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);

  document.addEventListener('shopify:section:load', function (event) {
    if (event && event.target) init(event.target);
  });

  document.addEventListener('shopify:section:unload', function (event) {
    if (!event || !event.target) return;
    destroyAnnouncements(event.target);
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
