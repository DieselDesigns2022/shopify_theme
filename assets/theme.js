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
    slideshow: '[data-slideshow]',
    countdown: '[data-countdown]',
    video: '[data-video-section]',
    focusable: 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  };

  var revealObserver = null;
  var announcementControllers = new WeakMap();
  var headerControllers = new WeakMap();
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function getFocusable(container) {
    if (!container) return [];
    return Array.prototype.slice.call(container.querySelectorAll(selectors.focusable)).filter(function (element) {
      return element.offsetParent !== null || element === document.activeElement;
    });
  }

  function addCleanup(cleanup, element, eventName, handler, options) {
    element.addEventListener(eventName, handler, options);
    cleanup.push(function () { element.removeEventListener(eventName, handler, options); });
  }

  function initHeader(header) {
    if (!header || headerControllers.has(header)) return;
    var cleanup = [];
    var timeouts = [];
    var rafId = null;
    var resizeObserver = null;
    var trigger = header.querySelector(selectors.trigger);
    var menu = header.querySelector(selectors.menu);
    var close = header.querySelector(selectors.close);
    var overlay = header.querySelector(selectors.overlay);
    var toggles = Array.prototype.slice.call(header.querySelectorAll('[data-header-toggle]'));
    var mobileToggles = Array.prototype.slice.call(header.querySelectorAll('[data-mobile-submenu-toggle]'));
    var lastTrigger = null;
    var lastScrollY = window.scrollY || 0;
    var destroyed = false;

    function setTimeoutTracked(fn, delay) {
      var id = window.setTimeout(function () {
        timeouts = timeouts.filter(function (timeoutId) { return timeoutId !== id; });
        if (!destroyed) fn();
      }, delay);
      timeouts.push(id);
      return id;
    }

    function updateToggleLabel(toggle, isOpen) {
      var label = isOpen ? toggle.dataset.closeLabel : toggle.dataset.openLabel;
      if (label) toggle.setAttribute('aria-label', label);
    }

    function getPanel(toggle) {
      return document.getElementById(toggle.getAttribute('aria-controls'));
    }

    function getOpenToggle() {
      return toggles.find(function (toggle) { return toggle.getAttribute('aria-expanded') === 'true'; });
    }

    function isElementVisible(element) {
      if (!element) return false;
      var rect = element.getBoundingClientRect();
      return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
    }

    function focusSafeFallback() {
      var brand = header.querySelector('.site-header__brand');
      if (isElementVisible(brand) && typeof brand.focus === 'function') { brand.focus(); return; }
      var main = document.getElementById('MainContent');
      var focusable = getFocusable(main).filter(isElementVisible);
      var target = focusable[0] || main;
      if (target && typeof target.focus === 'function') target.focus();
    }

    function closeDetachedPanel(toggle) {
      var panel = getPanel(toggle);
      var focusWasInside = panel && panel.contains(document.activeElement);
      closePanel(toggle, false);
      if (focusWasInside) {
        if (isElementVisible(toggle)) toggle.focus();
        else focusSafeFallback();
      }
    }

    function positionPanel(panel) {
      if (!panel || panel.hidden) return;
      var item = panel.closest('.site-header__nav-item');
      if (!item) return;
      var itemRect = item.getBoundingClientRect();
      var headerRect = header.getBoundingClientRect();
      if (!header.classList.contains('is-sticky-capable') && (headerRect.bottom <= 0 || headerRect.top >= window.innerHeight)) {
        var detachedToggle = toggles.find(function (toggle) { return getPanel(toggle) === panel; });
        if (detachedToggle) closeDetachedPanel(detachedToggle);
        return;
      }
      var viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      var margin = 12;
      var top = Math.max(headerRect.bottom, 0) + margin;
      var maxHeight = Math.max(220, window.innerHeight - top - margin);
      var desiredLeft = itemRect.left;
      var desiredWidth = Math.max(256, Math.min(viewportWidth - (margin * 2), panel.offsetWidth || 320));

      if (panel.classList.contains('mega-menu')) {
        if (panel.classList.contains('mega-menu--full')) {
          desiredLeft = margin;
          desiredWidth = viewportWidth - (margin * 2);
        } else {
          desiredWidth = Math.min(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-width')) || 1200, viewportWidth - (margin * 2));
          desiredLeft = Math.max(margin, Math.min((viewportWidth - desiredWidth) / 2, viewportWidth - desiredWidth - margin));
        }
      } else {
        desiredWidth = Math.max(256, Math.min(360, viewportWidth - (margin * 2)));
        desiredLeft = Math.min(Math.max(margin, itemRect.left), viewportWidth - desiredWidth - margin);
      }

      panel.style.setProperty('--panel-top', (top - itemRect.top) + 'px');
      panel.style.setProperty('--panel-left', (desiredLeft - itemRect.left) + 'px');
      panel.style.setProperty('--panel-width', desiredWidth + 'px');
      panel.style.setProperty('--panel-max-height', maxHeight + 'px');
    }

    function positionOpenPanels() {
      toggles.forEach(function (toggle) {
        if (toggle.getAttribute('aria-expanded') === 'true') positionPanel(getPanel(toggle));
      });
    }

    function closePanel(toggle, returnFocus) {
      var panel = getPanel(toggle);
      toggle.setAttribute('aria-expanded', 'false');
      updateToggleLabel(toggle, false);
      if (panel) panel.hidden = true;
      var item = toggle.closest('.site-header__nav-item');
      if (item) item.classList.remove('is-open');
      if (returnFocus) toggle.focus();
    }

    function closeAllPanels(exceptToggle, returnFocusToggle) {
      toggles.forEach(function (toggle) {
        if (toggle !== exceptToggle && toggle.getAttribute('aria-expanded') === 'true') closePanel(toggle, toggle === returnFocusToggle);
      });
    }

    function openPanel(toggle) {
      var panel = getPanel(toggle);
      if (!panel) return;
      closeAllPanels(toggle);
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      updateToggleLabel(toggle, true);
      var item = toggle.closest('.site-header__nav-item');
      if (item) item.classList.add('is-open');
      positionPanel(panel);
    }

    function togglePanel(toggle) {
      if (toggle.getAttribute('aria-expanded') === 'true') closePanel(toggle, false); else openPanel(toggle);
    }

    toggles.forEach(function (toggle) {
      updateToggleLabel(toggle, false);
      addCleanup(cleanup, toggle, 'click', function () { togglePanel(toggle); });
      addCleanup(cleanup, toggle, 'keydown', function (event) { if (event.key === 'Escape') { event.preventDefault(); closePanel(toggle, true); } });
      var item = toggle.closest('.site-header__nav-item');
      var panel = getPanel(toggle);
      if (item) {
        addCleanup(cleanup, item, 'mouseenter', function () { openPanel(toggle); });
        addCleanup(cleanup, item, 'mouseleave', function () { if (!item.contains(document.activeElement)) closePanel(toggle, false); });
        addCleanup(cleanup, item, 'focusout', function () { setTimeoutTracked(function () { if (!item.contains(document.activeElement)) closePanel(toggle, false); }, 0); });
      }
      if (panel) {
        addCleanup(cleanup, panel, 'keydown', function (event) { if (event.key === 'Escape') { event.preventDefault(); closePanel(toggle, true); } });
      }
    });

    addCleanup(cleanup, document, 'click', function (event) {
      var openToggle = getOpenToggle();
      if (!openToggle) return;
      var openItem = openToggle.closest('.site-header__nav-item');
      if (openItem && !openItem.contains(event.target)) closePanel(openToggle, false);
    });
    addCleanup(cleanup, document, 'keydown', function (event) {
      if (event.key === 'Escape') {
        var openToggle = getOpenToggle();
        if (openToggle) closePanel(openToggle, true);
      }
    });

    function resetMobileSubmenus() {
      mobileToggles.forEach(function (toggle) {
        var panel = document.getElementById(toggle.getAttribute('aria-controls'));
        toggle.setAttribute('aria-expanded', 'false');
        if (panel) panel.hidden = true;
      });
    }

    function openMenu() {
      if (!menu || !overlay || !trigger) return;
      lastTrigger = document.activeElement;
      menu.hidden = false;
      overlay.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-menu-open');
      var focusable = getFocusable(menu);
      if (focusable.length) focusable[0].focus();
    }

    function focusVisibleHeaderControl() {
      var activeWasInMenu = menu && menu.contains(document.activeElement);
      if (!activeWasInMenu) return;
      var target = header.querySelector('.site-header__brand') || header.querySelector('.header-action:not([hidden])');
      if (target && typeof target.focus === 'function') target.focus();
    }

    function closeMenu(options) {
      resetMobileSubmenus();
      if (menu) menu.hidden = true;
      if (overlay) overlay.hidden = true;
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
      if (options && options.desktopResize) { focusVisibleHeaderControl(); return; }
      if (!options || options.returnFocus !== false) if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
    }

    function handleMobileKeydown(event) {
      if (!menu || menu.hidden) return;
      if (event.key === 'Escape') { closeMenu(); return; }
      if (event.key !== 'Tab') return;
      var focusable = getFocusable(menu);
      if (!focusable.length) { event.preventDefault(); return; }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    if (trigger && menu && overlay) {
      addCleanup(cleanup, trigger, 'click', function () { if (menu.hidden) openMenu(); else closeMenu(); });
      if (close) addCleanup(cleanup, close, 'click', function () { closeMenu(); });
      addCleanup(cleanup, overlay, 'click', function () { closeMenu(); });
      addCleanup(cleanup, header, 'keydown', handleMobileKeydown);
    }

    mobileToggles.forEach(function (toggle) {
      addCleanup(cleanup, toggle, 'click', function () {
        var panel = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!panel) return;
        var open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
        panel.hidden = open;
      });
    });

    function measureHeader() {
      var actions = header.querySelector('.site-header__actions');
      header.style.setProperty('--header-height', header.offsetHeight + 'px');
      header.style.setProperty('--header-action-width', (actions ? actions.offsetWidth : 0) + 'px');
      positionOpenPanels();
    }

    function syncHeaderState() {
      rafId = null;
      if (destroyed) return;
      var y = window.scrollY || 0;
      var behavior = header.dataset.stickyBehavior;
      var threshold = parseInt(header.dataset.transparentThreshold, 10) || 0;
      var designMode = header.dataset.designMode === 'true';
      var stickyCapable = behavior === 'always' || behavior === 'sticky-after-scroll' || behavior === 'hide-on-scroll';
      header.classList.toggle('is-sticky-capable', stickyCapable);
      header.classList.toggle('is-scrolled', y > threshold);
      if (designMode) {
        header.classList.remove('is-scroll-hidden');
        header.classList.add('is-scroll-visible');
      } else if (behavior === 'hide-on-scroll' && y > threshold && y > lastScrollY) {
        header.classList.add('is-scroll-hidden'); header.classList.remove('is-scroll-visible');
      } else {
        header.classList.remove('is-scroll-hidden'); header.classList.add('is-scroll-visible');
      }
      if (header.dataset.transparentActive === 'true') header.classList.toggle('is-solid', y > threshold);
      measureHeader();
      lastScrollY = y;
    }

    function requestSync() { if (rafId === null) rafId = window.requestAnimationFrame(syncHeaderState); }
    addCleanup(cleanup, window, 'scroll', requestSync, { passive: true });
    addCleanup(cleanup, window, 'resize', function () { if (window.innerWidth >= 750) closeMenu({ desktopResize: true, returnFocus: false }); requestSync(); });
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(requestSync);
      resizeObserver.observe(header);
    }
    syncHeaderState();

    headerControllers.set(header, function () {
      destroyed = true;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (resizeObserver) resizeObserver.disconnect();
      timeouts.forEach(function (id) { window.clearTimeout(id); });
      closeMenu({ returnFocus: false });
      closeAllPanels();
      cleanup.forEach(function (fn) { fn(); });
      headerControllers.delete(header);
    });
  }

  function showRevealItems() {
    document.querySelectorAll('.reveal-ready').forEach(function (item) {
      item.classList.remove('reveal-ready');
      item.classList.add('reveal-visible');
    });
  }

  function canReveal() {
    if (!document.body || document.body.dataset.revealAnimation !== 'true') return false;
    if (document.body.dataset.revealStyle === 'none') return false;
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
          entry.target.classList.remove('reveal-ready');
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
    var focusoutTimeout = null;
    var index = 0;
    var userPaused = false;
    var hoverPaused = false;
    var focusPaused = false;
    var destroyed = false;
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
    var onFocusOut = function () {
      if (focusoutTimeout !== null) {
        window.clearTimeout(focusoutTimeout);
      }

      focusoutTimeout = window.setTimeout(function () {
        focusoutTimeout = null;
        if (destroyed) return;
        focusPaused = section.contains(document.activeElement);
        syncMotion();
      }, 0);
    };
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
    announcementControllers.set(section, function () {
      destroyed = true;
      if (focusoutTimeout !== null) {
        window.clearTimeout(focusoutTimeout);
        focusoutTimeout = null;
      }
      stopTimer();
      cleanup.forEach(function (fn) { fn(); });
      announcementControllers.delete(section);
    });
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


  function destroyHeaders(scope) {
    var root = scope || document;
    var headers = [];
    if (root.matches && root.matches(selectors.header)) headers.push(root);
    Array.prototype.slice.call(root.querySelectorAll(selectors.header)).forEach(function (header) { headers.push(header); });
    headers.forEach(function (header) {
      var cleanup = headerControllers.get(header);
      if (cleanup) cleanup();
    });
  }

  var slideshowControllers = new WeakMap();
  var countdownControllers = new WeakMap();
  var videoControllers = new WeakMap();
  var productControllers = new WeakMap();

  function initProduct(section) {
    if (!section || productControllers.has(section)) return;
    var gallery = section.querySelector('[data-product-gallery]'); var quantityInput = section.querySelector('input[name="quantity"]'); var cleanup = [];
    function add(el, name, fn) { if (!el) return; el.addEventListener(name, fn); cleanup.push(function () { el.removeEventListener(name, fn); }); }
    function change(n) { if (quantityInput) quantityInput.value = Math.max(1, (parseInt(quantityInput.value, 10) || 1) + n); } add(section.querySelector('[data-quantity-decrease]'), 'click', function () { change(-1); }); add(section.querySelector('[data-quantity-increase]'), 'click', function () { change(1); }); add(quantityInput, 'change', function () { if ((parseInt(quantityInput.value, 10) || 0) < 1) quantityInput.value = 1; });
    if (gallery) { var media = Array.prototype.slice.call(gallery.querySelectorAll('[data-product-media]')); var thumbs = Array.prototype.slice.call(gallery.querySelectorAll('[data-product-thumbnail]')); var initialMediaId = gallery.dataset.initialMediaId; var active = media.map(function (item) { return item.dataset.mediaId; }).indexOf(initialMediaId); if (active < 0) active = 0; var modal = gallery.querySelector('[data-product-modal]'), modalImage = gallery.querySelector('[data-product-modal-image]'), close = gallery.querySelector('[data-product-modal-close]'), lastFocus = null;
      function show(index) { if (!media.length) return; active = (index + media.length) % media.length; media.forEach(function (item, i) { item.hidden = i !== active; }); thumbs.forEach(function (item, i) { item.setAttribute('aria-selected', i === active ? 'true' : 'false'); }); }
      function closeModal() { if (!modal || modal.hidden) return; modal.hidden = true; document.body.classList.remove('product-modal-open'); if (lastFocus) lastFocus.focus(); }
      function trap(event) { if (!modal || modal.hidden) return; if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; } if (event.key !== 'Tab') return; var nodes = getFocusable(modal); if (!nodes.length) { event.preventDefault(); return; } if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes[nodes.length - 1].focus(); } else if (!event.shiftKey && document.activeElement === nodes[nodes.length - 1]) { event.preventDefault(); nodes[0].focus(); } }
      thumbs.forEach(function (thumb, index) { add(thumb, 'click', function () { show(index); }); add(thumb, 'keydown', function (event) { var next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? index + 1 : (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? index - 1 : null); if (next !== null) { event.preventDefault(); next = (next + thumbs.length) % thumbs.length; thumbs[next].focus(); show(next); } }); });
      add(gallery.querySelector('[data-product-gallery-prev]'), 'click', function () { show(active - 1); }); add(gallery.querySelector('[data-product-gallery-next]'), 'click', function () { show(active + 1); });
      Array.prototype.slice.call(gallery.querySelectorAll('[data-product-zoom]')).forEach(function (button) { add(button, 'click', function () { var image = button.parentNode.querySelector('img'); if (!modal || !modalImage || !image) return; lastFocus = button; modalImage.src = image.currentSrc || image.src; modalImage.alt = image.alt; modal.hidden = false; document.body.classList.add('product-modal-open'); close.focus(); }); }); add(close, 'click', closeModal); add(modal, 'click', function (event) { if (event.target === modal) closeModal(); }); add(document, 'keydown', trap); show(active); gallery.classList.add('is-initialized'); }
    productControllers.set(section, { destroy: function () { if (gallery) { var modal = gallery.querySelector('[data-product-modal]'); if (modal) modal.hidden = true; } document.body.classList.remove('product-modal-open'); cleanup.forEach(function (fn) { fn(); }); productControllers.delete(section); } });
  }

  function initSlideshow(section) {
    if (!section || slideshowControllers.has(section)) return;
    var slides = Array.prototype.slice.call(section.querySelectorAll('[data-slide]'));
    if (!slides.length) return;
    if (section.dataset.hasControls !== 'true') return;
    var dots = Array.prototype.slice.call(section.querySelectorAll('[data-slide-to]')); var rotation = section.querySelector('[data-slideshow-rotation]'); var status = section.querySelector('[data-slideshow-status]');
    var index = 0, timer = null, explicitlyPaused = false, focusStopped = false, hoverStopped = false, editorStopped = false, cleanup = [];
    function add(el, name, fn) { el.addEventListener(name, fn); cleanup.push(function () { el.removeEventListener(name, fn); }); }
    function canRotate() { return section.dataset.autoplay === 'true' && slides.length > 1 && !explicitlyPaused && !focusStopped && !hoverStopped && !editorStopped && !document.hidden && !reduceMotion.matches; }
    function stop() { if (timer !== null) { window.clearInterval(timer); timer = null; } }
    function updateButton() { if (!rotation) return; var running = timer !== null; rotation.textContent = running ? rotation.dataset.pauseLabel : rotation.dataset.playLabel; rotation.setAttribute('aria-label', rotation.textContent); rotation.setAttribute('aria-pressed', running ? 'false' : 'true'); }
    function start() { stop(); if (canRotate()) timer = window.setInterval(function () { show(index + 1, false); }, (parseInt(section.dataset.speed, 10) || 5) * 1000); updateButton(); }
    function show(next, announce) { index = (next + slides.length) % slides.length; slides.forEach(function (slide, i) { var active = i === index; slide.hidden = !active; slide.setAttribute('aria-hidden', active ? 'false' : 'true'); }); dots.forEach(function (dot, i) { dot.setAttribute('aria-current', i === index ? 'true' : 'false'); }); if (announce && status) status.textContent = 'Slide ' + (index + 1) + ' of ' + slides.length; }
    function navigate(next) { stop(); show(next, true); if (canRotate()) start(); else updateButton(); }
    show(0, false); section.classList.add('is-initialized');
    Array.prototype.slice.call(section.querySelectorAll('[data-slide-next]')).forEach(function (b) { add(b, 'click', function () { navigate(index + 1); }); }); Array.prototype.slice.call(section.querySelectorAll('[data-slide-prev]')).forEach(function (b) { add(b, 'click', function () { navigate(index - 1); }); }); dots.forEach(function (b) { add(b, 'click', function () { navigate(parseInt(b.dataset.slideTo, 10)); }); });
    if (rotation) add(rotation, 'click', function () { if (timer !== null) { explicitlyPaused = true; stop(); updateButton(); } else { explicitlyPaused = false; focusStopped = false; start(); } });
    add(section, 'focusin', function () { focusStopped = true; stop(); updateButton(); }); add(section, 'mouseenter', function () { hoverStopped = true; stop(); updateButton(); }); add(section, 'mouseleave', function () { hoverStopped = false; start(); }); add(document, 'visibilitychange', start);
    var motion = function () { start(); }; if (reduceMotion.addEventListener) { reduceMotion.addEventListener('change', motion); cleanup.push(function () { reduceMotion.removeEventListener('change', motion); }); } else { reduceMotion.addListener(motion); cleanup.push(function () { reduceMotion.removeListener(motion); }); }
    add(document, 'shopify:block:select', function (event) { var selected = event.target && event.target.closest ? event.target.closest('[data-slide]') : null; if (selected && section.contains(selected)) { editorStopped = true; show(slides.indexOf(selected), true); stop(); updateButton(); } }); add(document, 'shopify:block:deselect', function (event) { var selected = event.target && event.target.closest ? event.target.closest('[data-slide]') : null; if (selected && section.contains(selected)) { editorStopped = false; start(); } }); start();
    slideshowControllers.set(section, { destroy: function () { stop(); cleanup.forEach(function (fn) { fn(); }); slideshowControllers.delete(section); } });
  }

  function initCountdown(section) {
    if (!section || countdownControllers.has(section)) return;
    var target = Date.parse(section.dataset.target || ''); var units = section.querySelector('[data-countdown-units]'); var complete = section.querySelector('[data-countdown-complete]'); var invalid = section.querySelector('[data-countdown-invalid]');
    if (isNaN(target)) { if (invalid && window.Shopify && window.Shopify.designMode) invalid.hidden = false; return; }
    var interval = null, finished = false;
    function render(remaining) { var values = { days: Math.floor(remaining / 86400000), hours: Math.floor(remaining / 3600000) % 24, minutes: Math.floor(remaining / 60000) % 60, seconds: Math.floor(remaining / 1000) % 60 }; Object.keys(values).forEach(function (key) { var el = section.querySelector('[data-countdown-' + key + ']'); if (el) el.textContent = values[key]; }); }
    function finish() { if (finished) return; finished = true; if (interval !== null) { window.clearInterval(interval); interval = null; } if (units) units.hidden = true; if (complete) complete.hidden = false; }
    function tick() { var remaining = Math.max(0, target - Date.now()); render(remaining); if (remaining === 0) finish(); }
    if (target <= Date.now()) finish(); else { if (units) { units.hidden = false; units.classList.add('is-ready'); } tick(); interval = window.setInterval(tick, 1000); }
    countdownControllers.set(section, { destroy: function () { if (interval !== null) window.clearInterval(interval); countdownControllers.delete(section); } });
  }
  function initVideo(section) {
    if (!section || videoControllers.has(section)) return;
    var video = section.querySelector('video[data-video]'); var frame = section.querySelector('iframe[data-video-frame]'); var automaticPlayPending = false, automaticallyStarted = false, cleanup = [];
    function add(el, name, fn) { if (!el) return; el.addEventListener(name, fn); cleanup.push(function () { el.removeEventListener(name, fn); }); }
    function setFrame(autoplay) { if (!frame) return; var next = autoplay && !reduceMotion.matches ? frame.dataset.autoplaySrc : frame.dataset.staticSrc; if (next && frame.getAttribute('src') !== next) frame.setAttribute('src', next); }
    function sync() { var canAutoplay = section.dataset.autoplay === 'true' && section.dataset.muted === 'true' && !reduceMotion.matches; setFrame(canAutoplay); if (!video) return; if (canAutoplay && !automaticallyStarted) { automaticPlayPending = true; video.play().catch(function () { automaticPlayPending = false; }); } else if (!canAutoplay && automaticallyStarted) { video.pause(); automaticallyStarted = false; } }
    add(video, 'play', function () { if (automaticPlayPending) { automaticallyStarted = true; automaticPlayPending = false; } else { automaticallyStarted = false; } });
    add(video, 'pause', function () { if (!automaticPlayPending) automaticallyStarted = false; });
    var motion = function () { sync(); }; if (reduceMotion.addEventListener) { reduceMotion.addEventListener('change', motion); cleanup.push(function () { reduceMotion.removeEventListener('change', motion); }); } else { reduceMotion.addListener(motion); cleanup.push(function () { reduceMotion.removeListener(motion); }); }
    sync(); videoControllers.set(section, { destroy: function () { if (automaticallyStarted && video) video.pause(); cleanup.forEach(function (fn) { fn(); }); videoControllers.delete(section); } });
  }

  function destroyDynamic(scope) { var root = scope || document; [selectors.slideshow, selectors.countdown, selectors.video].forEach(function (selector) { var items = []; if (root.matches && root.matches(selector)) items.push(root); Array.prototype.slice.call(root.querySelectorAll(selector)).forEach(function (item) { items.push(item); }); items.forEach(function (item) { var controller = (selector === selectors.slideshow ? slideshowControllers : (selector === selectors.countdown ? countdownControllers : videoControllers)).get(item); if (controller) controller.destroy(); }); }); var products = []; if (root.matches && root.matches('[data-product-section]')) products.push(root); Array.prototype.slice.call(root.querySelectorAll('[data-product-section]')).forEach(function (item) { products.push(item); }); products.forEach(function (item) { var controller = productControllers.get(item); if (controller) controller.destroy(); }); }

  function init(scope) {
    var root = scope || document;
    if (root !== document && root.matches && root.matches(selectors.header)) initHeader(root);
    root.querySelectorAll(selectors.header).forEach(initHeader);
    if (root !== document && root.matches && root.matches(selectors.announcement)) initAnnouncement(root);
    root.querySelectorAll(selectors.announcement).forEach(initAnnouncement);
    if (root !== document && root.matches && root.matches(selectors.slideshow)) initSlideshow(root);
    root.querySelectorAll(selectors.slideshow).forEach(initSlideshow);
    if (root !== document && root.matches && root.matches(selectors.countdown)) initCountdown(root);
    root.querySelectorAll(selectors.countdown).forEach(initCountdown);
    if (root !== document && root.matches && root.matches(selectors.video)) initVideo(root);
    root.querySelectorAll(selectors.video).forEach(initVideo);
    if (root !== document && root.matches && root.matches('[data-product-section]')) initProduct(root);
    root.querySelectorAll('[data-product-section]').forEach(initProduct);
    initReveal(root);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { init(document); });
  else init(document);

  document.addEventListener('shopify:section:load', function (event) {
    if (event && event.target) init(event.target);
  });

  document.addEventListener('shopify:section:unload', function (event) {
    if (!event || !event.target) return;
    destroyDynamic(event.target);
    destroyAnnouncements(event.target);
    destroyHeaders(event.target);

    if (revealObserver) {
      var revealItems = Array.prototype.slice.call(event.target.querySelectorAll(selectors.reveal));
      if (event.target.matches && event.target.matches(selectors.reveal)) revealItems.unshift(event.target);
      revealItems.forEach(function (item) {
        revealObserver.unobserve(item);
      });
    }
  });
}());
