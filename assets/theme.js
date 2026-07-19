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
  var predictiveSearchControllers = new WeakMap();
  var cartControllers = new WeakMap();
  var cartDrawerControllers = new WeakMap();
  var quickAddControllers = new WeakMap();
  var faqControllers = new WeakMap();
  var shareControllers = new WeakMap();
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function resolveCurrentCartDrawer() {
    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-cart-trigger]')).filter(function (trigger) { return document.contains(trigger); });
    for (var index = 0; index < triggers.length; index += 1) { var dialog = document.getElementById(triggers[index].getAttribute('aria-controls')); var root = dialog && dialog.closest('[data-cart-drawer]'); if (dialog && root && document.contains(root) && cartDrawerControllers.has(root)) return { root: root, drawerId: dialog.id, trigger: triggers[index] }; }
    var drawers = Array.prototype.slice.call(document.querySelectorAll('[data-cart-drawer]')).filter(function (root) { return document.contains(root) && cartDrawerControllers.has(root) && root.querySelector('[data-cart-drawer-dialog]'); });
    if (drawers.length === 1) { var onlyDialog = drawers[0].querySelector('[data-cart-drawer-dialog]'); return { root: drawers[0], drawerId: onlyDialog.id, trigger: null }; }
    return null;
  }
  function cartTriggersForDialog(dialog) {
    return Array.prototype.slice.call(document.querySelectorAll('[data-cart-trigger]')).filter(function (trigger) { return trigger.getAttribute('aria-controls') === dialog.id; });
  }
  function syncCartDrawerTriggers() {
    var target = resolveCurrentCartDrawer();
    if (!target) return;
    var controller = cartDrawerControllers.get(target.root);
    var expanded = controller && controller.isOpen() ? 'true' : 'false';
    document.querySelectorAll('[data-cart-trigger]').forEach(function (trigger) { trigger.setAttribute('aria-controls', target.drawerId); trigger.setAttribute('aria-expanded', expanded); });
  }
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
    addCleanup(cleanup, document, 'theme:overlay:close', function () { closeMenu({ returnFocus: false }); });
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

  function initPredictiveSearch(root) {
    if (!root || predictiveSearchControllers.has(root)) return;
    var cleanup = [], input = root.querySelector('[data-predictive-search-input]'), results = root.querySelector('[data-predictive-search-results]'), status = root.querySelector('[data-predictive-search-status]'), close = root.querySelector('[data-predictive-search-close]');
    var header = root.closest('[data-header-section]'), trigger = header && header.querySelector('[data-predictive-search-trigger]'), timer = null, controller = null, generation = 0, requestedQuery = '', renderedQuery = '', destroyed = false, opener = null;
    if (!input || !results) return;
    root.classList.add('is-enhanced');
    root.hidden = true;
    function isActive() { return !destroyed && document.documentElement.contains(root); }
    function add(element, name, handler) { if (!element) return; element.addEventListener(name, handler); cleanup.push(function () { element.removeEventListener(name, handler); }); }
    function cancel() { generation += 1; if (timer !== null) { window.clearTimeout(timer); timer = null; } if (controller) { controller.abort(); controller = null; } requestedQuery = ''; input.setAttribute('aria-busy', 'false'); results.setAttribute('aria-busy', 'false'); }
    function clear(message) { results.innerHTML = ''; renderedQuery = ''; input.setAttribute('aria-expanded', 'false'); if (message !== undefined && status) status.textContent = message; }
    function closeSearch(returnFocus) { if (root.hidden) return; cancel(); clear(''); root.hidden = true; document.body.classList.remove('predictive-search-open'); if (trigger) trigger.setAttribute('aria-expanded', 'false'); if (returnFocus && opener && typeof opener.focus === 'function') opener.focus(); }
    function openSearch(event) { opener = event && event.currentTarget ? event.currentTarget : trigger; var menuClose = header && header.querySelector('[data-mobile-menu-close]'); if (menuClose) menuClose.click(); root.hidden = false; document.body.classList.add('predictive-search-open'); if (trigger) trigger.setAttribute('aria-expanded', 'true'); window.setTimeout(function () { if (isActive()) input.focus(); }, 0); }
    function resultLinks() { return Array.prototype.slice.call(results.querySelectorAll('a[href]')); }
    function renderLoading() { results.innerHTML = '<p class="predictive-search__loading">Loading suggestions…</p>'; input.setAttribute('aria-expanded', 'true'); input.setAttribute('aria-busy', 'true'); results.setAttribute('aria-busy', 'true'); if (status) status.textContent = 'Loading suggestions'; }
    function request(query) {
      var current = ++generation;
      if (controller) controller.abort();
      controller = 'AbortController' in window ? new AbortController() : null;
      requestedQuery = query;
      renderLoading();
      var url = new URL(root.dataset.predictiveSearchUrl, window.location.origin);
      url.searchParams.set('q', query);
      url.searchParams.set('section_id', root.dataset.predictiveSearchSection);
      url.searchParams.set('resources[type]', 'product,collection,page,article,query');
      url.searchParams.set('resources[limit]', '6');
      url.searchParams.set('resources[options][unavailable_products]', 'last');
      fetch(url.toString(), { signal: controller ? controller.signal : undefined, credentials: 'same-origin' }).then(function (response) { if (!response.ok) throw new Error('Search unavailable'); return response.text(); }).then(function (markup) {
        if (!isActive() || current !== generation || root.hidden) return;
        var documentResponse = new DOMParser().parseFromString(markup, 'text/html');
        var response = documentResponse.querySelector('[data-predictive-search-response]');
        if (!response) throw new Error('Search unavailable');
        Array.prototype.slice.call(response.querySelectorAll('script')).forEach(function (script) { script.remove(); });
        results.innerHTML = response.innerHTML;
        renderedQuery = query;
        requestedQuery = '';
        var links = resultLinks();
        input.setAttribute('aria-expanded', links.length ? 'true' : 'false');
        if (status) status.textContent = links.length ? links.length + ' search suggestions available.' : 'No suggestions found.';
      }).catch(function (error) {
        if (!isActive() || current !== generation || (error && error.name === 'AbortError')) return;
        requestedQuery = ''; renderedQuery = '';
        results.innerHTML = '<p class="predictive-search__empty">Suggestions are unavailable. You can still submit your search.</p>';
        input.setAttribute('aria-expanded', 'false'); if (status) status.textContent = 'Suggestions are unavailable.';
      }).then(function () { if (isActive() && current === generation) { controller = null; input.setAttribute('aria-busy', 'false'); results.setAttribute('aria-busy', 'false'); } });
    }
    function schedule() { var query = input.value.trim(); cancel(); if (!query) { clear(''); return; } root.hidden = false; if (query === renderedQuery) return; clear(''); timer = window.setTimeout(function () { timer = null; request(query); }, 250); }
    add(trigger, 'click', function (event) { event.preventDefault(); if (root.hidden) openSearch(event); else closeSearch(true); });
    add(close, 'click', function () { closeSearch(true); });
    add(input, 'input', schedule);
    add(input, 'keydown', function (event) { var links = resultLinks(); if (event.key === 'ArrowDown' && links.length) { event.preventDefault(); links[0].focus(); } else if (event.key === 'Escape') { event.preventDefault(); closeSearch(true); } });
    add(results, 'keydown', function (event) { var links = resultLinks(), position = links.indexOf(document.activeElement); if (event.key === 'ArrowDown' && position >= 0 && position < links.length - 1) { event.preventDefault(); links[position + 1].focus(); } else if (event.key === 'ArrowUp' && position >= 0) { event.preventDefault(); if (position === 0) input.focus(); else links[position - 1].focus(); } else if (event.key === 'Escape') { event.preventDefault(); closeSearch(true); } });
    add(root, 'click', function (event) { if (event.target === root) closeSearch(true); });
    add(document, 'keydown', function (event) { if (event.key === 'Escape' && !root.hidden) { event.preventDefault(); closeSearch(true); } });
    add(document, 'theme:overlay:close', function () { closeSearch(false); });
    predictiveSearchControllers.set(root, { destroy: function () { destroyed = true; cancel(); clear(''); root.hidden = true; document.body.classList.remove('predictive-search-open'); if (trigger) trigger.setAttribute('aria-expanded', 'false'); cleanup.forEach(function (fn) { fn(); }); predictiveSearchControllers.delete(root); } });
  }

  function destroyPredictiveSearch(scope) { var root = scope || document, items = []; if (root.matches && root.matches('[data-predictive-search]')) items.push(root); Array.prototype.slice.call(root.querySelectorAll('[data-predictive-search]')).forEach(function (item) { items.push(item); }); items.forEach(function (item) { var search = predictiveSearchControllers.get(item); if (search) search.destroy(); }); }

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
  var browseControllers = new WeakMap();
  var productControllers = new WeakMap();

  function initProduct(section) {
    if (!section || productControllers.has(section)) return;
    var gallery = section.querySelector('[data-product-gallery]'), quantityInput = section.querySelector('input[name="quantity"]'), cleanup = [];
    function add(el, name, fn) { if (!el) return; el.addEventListener(name, fn); cleanup.push(function () { el.removeEventListener(name, fn); }); }
    function change(n) { if (quantityInput) quantityInput.value = Math.max(1, (parseInt(quantityInput.value, 10) || 1) + n); }
    add(section.querySelector('[data-quantity-decrease]'), 'click', function () { change(-1); }); add(section.querySelector('[data-quantity-increase]'), 'click', function () { change(1); }); add(quantityInput, 'change', function () { if ((parseInt(quantityInput.value, 10) || 0) < 1) quantityInput.value = 1; });
    var selectMedia = function () {};
    if (gallery) { var media = Array.prototype.slice.call(gallery.querySelectorAll('[data-product-media]')), thumbs = Array.prototype.slice.call(gallery.querySelectorAll('[data-product-thumbnail]')), initialMediaId = gallery.dataset.initialMediaId, active = media.map(function (item) { return item.dataset.mediaId; }).indexOf(initialMediaId); if (active < 0) active = 0; var modal = gallery.querySelector('[data-product-modal]'), modalImage = gallery.querySelector('[data-product-modal-image]'), close = gallery.querySelector('[data-product-modal-close]'), lastFocus = null;
      function show(index) { if (!media.length) return; active = (index + media.length) % media.length; media.forEach(function (item, i) { item.hidden = i !== active; }); thumbs.forEach(function (item, i) { item.setAttribute('aria-selected', i === active ? 'true' : 'false'); }); }
      selectMedia = function (mediaId) { var index = media.map(function (item) { return String(item.dataset.mediaId); }).indexOf(String(mediaId)); if (index >= 0) show(index); };
      function closeModal() { if (!modal || modal.hidden) return; modal.hidden = true; document.body.classList.remove('product-modal-open'); if (lastFocus) lastFocus.focus(); }
      function trap(event) { if (!modal || modal.hidden) return; if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; } if (event.key !== 'Tab') return; var nodes = getFocusable(modal); if (!nodes.length) { event.preventDefault(); return; } if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes[nodes.length - 1].focus(); } else if (!event.shiftKey && document.activeElement === nodes[nodes.length - 1]) { event.preventDefault(); nodes[0].focus(); } }
      thumbs.forEach(function (thumb, index) { add(thumb, 'click', function () { show(index); }); add(thumb, 'keydown', function (event) { var next = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? index + 1 : (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? index - 1 : null); if (next !== null) { event.preventDefault(); next = (next + thumbs.length) % thumbs.length; thumbs[next].focus(); show(next); } }); });
      add(gallery.querySelector('[data-product-gallery-prev]'), 'click', function () { show(active - 1); }); add(gallery.querySelector('[data-product-gallery-next]'), 'click', function () { show(active + 1); }); Array.prototype.slice.call(gallery.querySelectorAll('[data-product-zoom]')).forEach(function (button) { add(button, 'click', function () { var image = button.parentNode.querySelector('img'); if (!modal || !modalImage || !image) return; lastFocus = button; modalImage.src = image.currentSrc || image.src; modalImage.alt = image.alt; modal.hidden = false; document.body.classList.add('product-modal-open'); close.focus(); }); }); add(close, 'click', closeModal); add(modal, 'click', function (event) { if (event.target === modal) closeModal(); }); add(document, 'keydown', trap); show(active); gallery.classList.add('is-initialized'); }
    Array.prototype.slice.call(section.querySelectorAll('[data-character-input]')).forEach(function (input) { var counter = input.parentNode.querySelector('[data-character-counter]'); function updateCounter() { if (!counter) return; var maximum = Number(counter.dataset.maximum); counter.textContent = input.value.length + (maximum > 0 ? ' of ' + maximum + ' characters' : ' characters'); } add(input, 'input', updateCounter); updateCounter(); });
    Array.prototype.slice.call(section.querySelectorAll('[data-file-input]')).forEach(function (input) { var status = input.parentNode.querySelector('[data-file-name]'); function updateFileName() { if (status) status.textContent = input.files && input.files.length ? input.files[0].name : 'No file selected.'; } add(input, 'change', updateFileName); updateFileName(); });
    Array.prototype.slice.call(section.querySelectorAll('[data-size-chart-modal]')).forEach(function (sizeModal) { var trigger = section.querySelector('[data-size-chart-trigger][aria-controls="' + sizeModal.id + '"]'), closeButton = sizeModal.querySelector('[data-size-chart-close]'), lastFocus = null; function closeSizeChart() { if (sizeModal.hidden) return; sizeModal.hidden = true; document.body.classList.remove('product-modal-open'); if (lastFocus) lastFocus.focus(); } function trapSizeChart(event) { if (sizeModal.hidden) return; if (event.key === 'Escape') { event.preventDefault(); closeSizeChart(); return; } if (event.key !== 'Tab') return; var nodes = getFocusable(sizeModal); if (!nodes.length) { event.preventDefault(); return; } if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes[nodes.length - 1].focus(); } else if (!event.shiftKey && document.activeElement === nodes[nodes.length - 1]) { event.preventDefault(); nodes[0].focus(); } } if (trigger) add(trigger, 'click', function () { lastFocus = trigger; sizeModal.hidden = false; document.body.classList.add('product-modal-open'); if (closeButton) closeButton.focus(); }); add(closeButton, 'click', closeSizeChart); add(sizeModal, 'click', function (event) { if (event.target === sizeModal) closeSizeChart(); }); add(document, 'keydown', trapSizeChart); });
    var variantData = section.querySelector('[data-product-variants]'), variants = [];
    try { variants = variantData ? JSON.parse(variantData.textContent) : []; } catch (error) { variants = []; }
    var controls = Array.prototype.slice.call(section.querySelectorAll('[data-option-value]')), form = section.querySelector('[data-product-form]'), idInput = section.querySelector('[data-variant-id]'), addButton = section.querySelector('[data-add-to-cart]'), addLabel = section.querySelector('[data-add-to-cart-label]'), status = section.querySelector('[data-variant-status]'), dynamicCheckout = section.querySelector('[data-dynamic-checkout]'), price = section.querySelector('[data-product-price]');
    function values() { var result = []; for (var position = 1; position <= 3; position += 1) { var group = controls.filter(function (control) { return Number(control.dataset.optionPosition) === position; }); if (!group.length) continue; var selected = group.find(function (control) { return control.type === 'radio' ? control.checked : true; }); result.push(selected ? selected.value : null); } return result; }
    function matches(variant, selected, ignore) { return selected.every(function (value, index) { return index === ignore || variant.options[index] === value; }); }
    function formatMoney(cents) { var amount = (Number(cents) || 0) / 100, format = section.dataset.moneyFormat || '{{ amount }}'; function number(decimals, decimal, thousands) { var fixed = amount.toFixed(decimals), parts = fixed.split('.'); parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands); return parts.length > 1 ? parts[0] + decimal + parts[1] : parts[0]; } var formats = { amount: number(2, '.', ','), amount_no_decimals: number(0, '.', ','), amount_with_comma_separator: number(2, ',', '.'), amount_no_decimals_with_comma_separator: number(0, ',', '.') }; return format.replace(/\{\{\s*(amount_no_decimals_with_comma_separator|amount_with_comma_separator|amount_no_decimals|amount)\s*\}\}/g, function (match, placeholder) { return formats[placeholder]; }); }
    function unitPrice(variant) { var measurement = variant.unit_price_measurement; if (!measurement) return ''; return formatMoney(variant.unit_price) + ' / ' + (measurement.reference_value !== 1 ? measurement.reference_value : '') + measurement.reference_unit; }
    function updatePrice(variant) { if (!price || !variant) return; var sale = variant.compare_at_price > variant.price, regular = price.querySelector('[data-price-regular]'), salePrice = price.querySelector('[data-price-sale]'), compare = price.querySelector('[data-price-compare]'), saleStatus = price.querySelector('[data-price-sale-status]'), unit = price.querySelector('[data-price-unit]'); price.classList.toggle('product-price--on-sale', sale); if (regular) { regular.textContent = formatMoney(variant.price); regular.hidden = sale; } if (salePrice) { salePrice.textContent = formatMoney(variant.price); salePrice.hidden = !sale; } if (compare) { compare.textContent = formatMoney(variant.compare_at_price); compare.hidden = !sale; } if (saleStatus) saleStatus.hidden = !sale; if (unit) { unit.textContent = unitPrice(variant); unit.hidden = !variant.unit_price_measurement; } }
    function updateOptions(selected) { controls.forEach(function (control) { var position = Number(control.dataset.optionPosition) - 1; function stateFor(value) { var next = selected.slice(); next[position] = value; var possible = variants.filter(function (variant) { return matches(variant, next); }), exists = possible.length > 0, available = possible.some(function (variant) { return variant.available; }); return { exists: exists, unavailable: exists && !available }; } if (control.tagName === 'SELECT') { Array.prototype.slice.call(control.options).forEach(function (option) { var state = stateFor(option.value); option.textContent = option.value + (!state.exists ? ' — Unavailable' : (state.unavailable ? ' — Sold out' : '')); }); return; } var state = stateFor(control.value), label = control.nextElementSibling, availability = label && label.querySelector('[data-option-availability]'); if (label) { label.classList.toggle('is-unavailable', state.unavailable); label.classList.toggle('is-impossible', !state.exists); } if (availability) availability.textContent = !state.exists ? 'Unavailable' : (state.unavailable ? 'Sold out' : ''); }); }

    function update(announce) { if (!variants.length) return; var selected = values(), variant = variants.find(function (item) { return matches(item, selected); }); controls.forEach(function (control) { var selectedText = control.closest('.product-variant-picker__group').querySelector('[data-selected-option]'); if (selectedText) selectedText.textContent = selected[Number(control.dataset.optionPosition) - 1] || ''; }); updateOptions(selected); var purchasable = !!(variant && variant.available), label = !variant ? 'Unavailable' : (purchasable ? 'Add to cart' : 'Sold out'); if (idInput) idInput.value = variant ? variant.id : ''; if (form) form.dataset.variantId = variant ? variant.id : ''; if (addButton) addButton.disabled = !purchasable; if (addLabel) addLabel.textContent = label; if (dynamicCheckout) dynamicCheckout.hidden = !purchasable; if (variant) { updatePrice(variant); if (variant.featured_media) selectMedia(variant.featured_media.id); var url = new URL(window.location.href); url.searchParams.set('variant', variant.id); window.history.replaceState({}, '', url.toString()); } if (status && announce) status.textContent = label; section.dispatchEvent(new CustomEvent('product:variant-change', { bubbles: true, detail: { variant: variant, available: purchasable } })); }
    section.classList.add('is-initialized');
    if (idInput) idInput.disabled = false;
    controls.forEach(function (control) { add(control, 'change', function () { update(true); }); }); if (controls.length && variants.length) update(false);
    add(form, 'submit', function (event) { if (!form || !form.dataset.productForm || form.enctype === 'multipart/form-data') return; event.preventDefault(); var submitter = event.submitter || addButton; if (submitter) submitter.disabled = true; fetch(form.action, { method: 'POST', credentials: 'same-origin', headers: { 'Accept': 'application/json' }, body: new FormData(form) }).then(function (response) { if (!response.ok) throw new Error('Add failed'); return response.json(); }).then(function () { return cartCoordinator.refresh(document.querySelector('[data-cart-drawer]')); }).then(function (cart) { var drawerTarget = resolveCurrentCartDrawer(); if (drawerTarget) document.dispatchEvent(new CustomEvent('theme:cart:open', { detail: { drawerId: drawerTarget.drawerId, itemCount: cart.item_count, opener: addButton } })); }).catch(function () { if (status) status.textContent = 'Unable to add this item to your cart. Please try again.'; }).finally(function () { if (submitter) submitter.disabled = false; }); });
    productControllers.set(section, { selectMedia: selectMedia, destroy: function () { if (gallery) { var productModal = gallery.querySelector('[data-product-modal]'); if (productModal) productModal.hidden = true; } Array.prototype.slice.call(section.querySelectorAll('[data-size-chart-modal]')).forEach(function (sizeModal) { sizeModal.hidden = true; }); document.body.classList.remove('product-modal-open'); cleanup.forEach(function (fn) { fn(); }); productControllers.delete(section); } });
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


  function initBrowse(section) {
    if (!section || browseControllers.has(section)) return;
    var cleanup = [], trigger = section.querySelector('[data-filter-open]'), panel = section.querySelector('[data-filter-panel]'), close = section.querySelector('[data-filter-close]');
    function add(el, name, fn) { if (!el) return; el.addEventListener(name, fn); cleanup.push(function () { el.removeEventListener(name, fn); }); }
    function shut() { if (!panel) return; panel.classList.remove('is-open'); if (trigger) { trigger.setAttribute('aria-expanded', 'false'); trigger.focus(); } }
    add(trigger, 'click', function () { if (!panel) return; var open = !panel.classList.contains('is-open'); panel.classList.toggle('is-open', open); trigger.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) { var focus = panel.querySelector('button, summary, input'); if (focus) focus.focus(); } });
    add(close, 'click', shut); add(panel, 'keydown', function (event) { if (event.key === 'Escape') { event.preventDefault(); shut(); } });
    Array.prototype.slice.call(section.querySelectorAll('[data-sort-select]')).forEach(function (select) { add(select, 'change', function () { if (select.form) select.form.submit(); }); });
    section.classList.add('is-browse-initialized');
    browseControllers.set(section, { destroy: function () { if (panel) panel.classList.remove('is-open'); if (trigger) trigger.setAttribute('aria-expanded', 'false'); section.classList.remove('is-browse-initialized'); cleanup.forEach(function (fn) { fn(); }); browseControllers.delete(section); } });
  }

  var cartCoordinator = (function () {
    var queue = Promise.resolve(), translatedCountLabel = '';
    function roots() { return Array.prototype.slice.call(document.querySelectorAll('[data-cart-section]')); }
    function sectionIds() { var seen={}; roots().forEach(function(root){(root.dataset.cartSections||'').split(',').forEach(function(id){if(id)seen[id]=true;});}); return Object.keys(seen); }
    function drawer() { return document.querySelector('[data-cart-drawer]'); }
    function setCounts(count) { var safe=Math.max(0,Number(count)||0),source=document.querySelector('[data-cart-drawer] [data-cart-item-count]'),label=source&&source.getAttribute('aria-label');if(label)translatedCountLabel=label;document.querySelectorAll('[data-header-cart-count],[data-cart-item-count]').forEach(function(node){node.textContent=safe;if(translatedCountLabel)node.setAttribute('aria-label',translatedCountLabel);}); }
    function activeStatusRoot() { var current=drawer(), controller=current&&cartDrawerControllers.get(current); if(controller&&controller.isOpen())return current; var page=Array.prototype.slice.call(document.querySelectorAll('.main-cart[data-cart-section]')).find(function(root){return root.offsetParent!==null;}); return page||current; }
    function announce(message,error) { var root=activeStatusRoot();if(!root)return;var target=root.querySelector(error?'[data-cart-error]':'[data-cart-status]');if(target){target.textContent=message;target.hidden=!message;}if(!error){var previous=root.querySelector('[data-cart-error]');if(previous){previous.hidden=true;previous.textContent='';}} }
    function snapshot() { var current=drawer(), controller=current&&cartDrawerControllers.get(current);return controller&&controller.isOpen()?controller.snapshot():null; }
    function safeReplace(id,html) { if(!html)return false;var parsed=new DOMParser().parseFromString(html,'text/html');parsed.querySelectorAll('script').forEach(function(script){script.remove();});var next=parsed.getElementById('shopify-section-'+id),current=document.getElementById('shopify-section-'+id);if(!next||!current)return false;destroyDynamic(current);current.replaceWith(next);init(next);return true; }
    function render(data,before) { if(!data||!data.sections)throw new Error('Invalid cart response');Object.keys(data.sections).forEach(function(id){safeReplace(id,data.sections[id]);});setCounts(data.item_count);if(before){var current=drawer(),controller=current&&cartDrawerControllers.get(current);if(controller)controller.restore(before);}document.dispatchEvent(new CustomEvent('theme:cart:updated',{detail:{itemCount:data.item_count}}));return data; }
    function request(route,body) { if(!route)return Promise.reject(new Error('Cart unavailable'));var before=snapshot();var run=function(){body.sections=sectionIds();return fetch(route,{method:'POST',credentials:'same-origin',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify(body)}).then(function(response){if(!response.ok)throw new Error('Cart request failed');return response.json();}).then(function(data){return render(data,before);});};var result=queue.then(run,run);queue=result.catch(function(){});return result; }
    function route(root,name){return root&&root.dataset[name]||'';}
    return { change:function(root,key,quantity){return request(route(root,'cartChangeUrl'),{id:key,quantity:Math.max(0,Number(quantity)||0)});},note:function(root,value){return request(route(root,'cartUpdateUrl'),{note:value});},refresh:function(root){return request(route(root,'cartUpdateUrl'),{});},announce:announce,countLabel:function(){return translatedCountLabel;} };
  }());

  function initCart(section) {
    if(!section||cartControllers.has(section))return;var cleanup=[],timers=[],destroyed=false;
    function add(el,name,fn){if(!el)return;el.addEventListener(name,fn);cleanup.push(function(){el.removeEventListener(name,fn);});}function track(timer){timers.push(timer);return timer;}function clear(timer){if(timer!==null){window.clearTimeout(timer);timers=timers.filter(function(id){return id!==timer;});}return null;}function busy(item,value){if(!item)return;item.setAttribute('aria-busy',value?'true':'false');item.querySelectorAll('button,input').forEach(function(el){el.disabled=value;});}
    function update(item,quantity,last){if(!item||destroyed)return;var input=item.querySelector('[data-cart-quantity-input]'),next=Math.max(0,parseInt(quantity,10)||0),confirmed=Number(item.dataset.cartQuantity||input.value||0),generation=last.generation+1;if(next===last.value)return;last.value=next;last.generation=generation;if(input)input.value=next;busy(item,true);cartCoordinator.change(section,item.dataset.cartLineKey,next).then(function(){if(last.generation===generation)last.confirmed=next;cartCoordinator.announce(next?'Quantity updated.':'Item removed.');}).catch(function(){if(!destroyed&&last.generation===generation){last.value=null;last.confirmed=confirmed;if(input)input.value=confirmed;busy(item,false);cartCoordinator.announce(next?'Unable to update cart. Please try again.':'Unable to remove item. Please try again.',true);}});}
    section.querySelectorAll('[data-cart-item]').forEach(function(item){var input=item.querySelector('[data-cart-quantity-input]'),timer=null,last={value:null,confirmed:Number(item.dataset.cartQuantity||input.value||0),generation:0};function submit(value){timer=clear(timer);update(item,value,last);}add(item.querySelector('[data-quantity-decrease]'),'click',function(){submit((parseInt(input.value,10)||0)-1);});add(item.querySelector('[data-quantity-increase]'),'click',function(){submit((parseInt(input.value,10)||0)+1);});add(input,'input',function(){var value=Math.max(0,parseInt(input.value,10)||0);input.value=value;timer=clear(timer);timer=track(window.setTimeout(function(){timers=timers.filter(function(id){return id!==timer;});timer=null;update(item,value,last);},450));});add(input,'change',function(){var value=Math.max(0,parseInt(input.value,10)||0);input.value=value;submit(value);});add(item.querySelector('.cart-item__remove'),'click',function(event){event.preventDefault();submit(0);});});
    section.querySelectorAll('[data-cart-previous-link]').forEach(function(link){function norm(path){path=(path||'/').replace(/\/{2,}/g,'/');return path.length>1?path.replace(/\/+$/,''):'/';}try{if(!document.referrer)return;var ref=new URL(document.referrer),current=new URL(window.location.href),configured=norm(link.dataset.cartRoute||'/cart').toLowerCase(),root=norm(link.dataset.cartRoot||'/'),locale=norm((root==='/'?'':root)+'/cart').toLowerCase(),path=norm(ref.pathname).toLowerCase();if(ref.origin===current.origin&&path!==norm(current.pathname).toLowerCase()&&path!==configured&&path!=='/cart'&&path!==locale)link.href=ref.href;}catch(error){}});
    var checkout=section.querySelector('[data-cart-checkout]'),terms=section.querySelector('[data-cart-terms]');add(checkout,'click',function(){if(terms&&!terms.checked)terms.focus();});var note=section.querySelector('[data-cart-note]'),noteTimer=null;add(note,'input',function(){var value=note.value;noteTimer=clear(noteTimer);noteTimer=track(window.setTimeout(function(){timers=timers.filter(function(id){return id!==noteTimer;});noteTimer=null;cartCoordinator.note(section,value).then(function(){cartCoordinator.announce('Note saved.');}).catch(function(){if(!destroyed){var current=document.querySelector('[data-cart-note]');if(current)current.value=value;cartCoordinator.announce('Unable to save note. Please try again.',true);}});},500));});cartControllers.set(section,{destroy:function(){destroyed=true;timers.forEach(window.clearTimeout);cleanup.forEach(function(fn){fn();});cartControllers.delete(section);}});
  }

  function initCartDrawer(section) {
    if(!section||cartDrawerControllers.has(section))return;var dialog=section.querySelector('[data-cart-drawer-dialog]'),overlay=section.querySelector('[data-cart-drawer-overlay]'),close=section.querySelector('[data-cart-drawer-close]'),cleanup=[],opener=null,open=false;if(!dialog||!overlay)return;
    function add(el,name,fn){if(!el)return;el.addEventListener(name,fn);cleanup.push(function(){el.removeEventListener(name,fn);});}function triggers(){return cartTriggersForDialog(dialog);}function currentOpener(){return opener&&document.contains(opener)?opener:triggers()[0]||null;}function closeDrawer(restore){if(!open)return;open=false;section.hidden=true;dialog.setAttribute('aria-hidden','true');document.body.classList.remove('cart-drawer-open');triggers().forEach(function(trigger){trigger.setAttribute('aria-expanded','false');});var target=currentOpener();if(restore&&target)target.focus();}function openDrawer(trigger,restore){opener=trigger&&document.contains(trigger)?trigger:currentOpener();open=true;section.hidden=false;dialog.setAttribute('aria-hidden','false');document.body.classList.add('cart-drawer-open');triggers().forEach(function(item){item.setAttribute('aria-expanded','true');});var target=close;if(restore&&restore.line)target=dialog.querySelector('[data-cart-line-key="'+CSS.escape(restore.line)+'"] [data-cart-quantity-input]')||close;else if(restore&&restore.note)target=dialog.querySelector('[data-cart-note]')||close;if(target)target.focus();}function key(event){if(!open)return;if(event.key==='Escape'){event.preventDefault();closeDrawer(true);return;}if(event.key==='Tab'){var nodes=getFocusable(dialog);if(!nodes.length){event.preventDefault();return;}if(event.shiftKey&&document.activeElement===nodes[0]){event.preventDefault();nodes[nodes.length-1].focus();}else if(!event.shiftKey&&document.activeElement===nodes[nodes.length-1]){event.preventDefault();nodes[0].focus();}}}function snapshot(){var active=document.activeElement,line=active&&active.closest&&active.closest('[data-cart-line-key]');return {opener:currentOpener(),line:line?line.dataset.cartLineKey:null,note:!!(active&&active.matches&&active.matches('[data-cart-note]'))};}
    add(document,'click',function(event){var trigger=event.target&&event.target.closest&&event.target.closest('[data-cart-trigger]');if(!trigger||trigger.getAttribute('aria-controls')!==dialog.id||!document.contains(section)||cartDrawerControllers.get(section)!==api)return;event.preventDefault();document.dispatchEvent(new CustomEvent('theme:overlay:close'));openDrawer(trigger);});add(close,'click',function(){closeDrawer(true);});add(overlay,'click',function(){closeDrawer(true);});add(document,'keydown',key);add(document,'theme:cart:open',function(event){var detail=event.detail||{};if(detail.drawerId!==dialog.id||!document.contains(section)||cartDrawerControllers.get(section)!==api)return;openDrawer(detail.opener);if(detail.itemCount!==undefined)cartCoordinator.announce(cartCoordinator.countLabel());});var api={isOpen:function(){return open;},snapshot:snapshot,restore:function(state){if(state)openDrawer(state.opener,state);},destroy:function(){closeDrawer(false);cleanup.forEach(function(fn){fn();});cartDrawerControllers.delete(section);}};cartDrawerControllers.set(section,api);
  }


  var overlayControllers = new WeakMap();
  var addressControllers = new WeakMap();
  var phase14DialogLocks = 0;
  var phase14VisitDismissals = {};
  var phase14PresentedSuccess = {};
  function safeStore(store, key, value) { try { if (value === null) store.removeItem(key); else store.setItem(key, value); return true; } catch (error) { return false; } }
  function readStore(store, key) { try { return store.getItem(key); } catch (error) { return null; } }
  function validTimestamp(value, days) { var timestamp = Number(value), duration = Math.max(0, Number(days) || 0) * 86400000; return Number.isFinite(timestamp) && timestamp > 0 && duration > 0 && Date.now() - timestamp < duration; }
  function lockPhase14Dialog() { phase14DialogLocks += 1; document.body.classList.add('dialog-open'); }
  function unlockPhase14Dialog() { phase14DialogLocks = Math.max(0, phase14DialogLocks - 1); if (!phase14DialogLocks) document.body.classList.remove('dialog-open'); }
  function initOverlay(root) {
    if (!root || overlayControllers.has(root)) return;
    var destroyed=false, open=false, timer=null, close=root.querySelector('[data-dialog-close]'), overlay=root.querySelector('[data-dialog-overlay]'), confirm=root.querySelector('[data-age-confirm]'), dialog=root.querySelector('[role="dialog"]'), opener=document.activeElement, isAge=root.hasAttribute('data-age-gate'), designMode=root.dataset.designMode === 'true', frequency=root.dataset.frequency || 'visit', days=Math.max(0,Number(root.dataset.days)||0), key=isAge?'theme-age-confirmed':'theme-promotion-dismissed', store=frequency==='session'?sessionStorage:localStorage;
    function restoreFocus(){ if(opener && opener.isConnected && typeof opener.focus==='function') opener.focus(); }
    function hasFreshSuccess(){ return !isAge && root.dataset.formSuccess==='true' && !phase14PresentedSuccess[root.id]; } function shouldSuppress(){ if(hasFreshSuccess()) return false; if(phase14VisitDismissals[root.id]) return true; if(root.dataset.homeOnly==='true' && root.dataset.isHomepage !== 'true') return true; if(root.dataset.disableMobile==='true' && window.matchMedia('(max-width: 749px)').matches) return true; if(designMode) return false; var value=readStore(store,key); if(isAge) { if(validTimestamp(value,days)) return true; if(value) safeStore(localStorage,key,null); return false; } if(frequency==='session') return value==='1'; if(frequency==='days') { if(validTimestamp(value,days)) return true; if(value) safeStore(localStorage,key,null); } return false; }
    function openDialog(){ if(destroyed || !root.isConnected || open) return; root.hidden=false; open=true; if(hasFreshSuccess()) phase14PresentedSuccess[root.id]=true; lockPhase14Dialog(); document.addEventListener('keydown',handleKeydown); if(dialog) dialog.focus(); }
    function closeDialog(){ if(destroyed || !open) return; root.hidden=true; open=false; unlockPhase14Dialog(); document.removeEventListener('keydown',handleKeydown); if(!isAge){ phase14VisitDismissals[root.id]=true; if(frequency==='session' && !designMode) safeStore(sessionStorage,key,'1'); else if(frequency==='days' && !designMode) safeStore(localStorage,key,String(Date.now())); } restoreFocus(); }
    function handleKeydown(event){ if(destroyed || !open) return; if(event.key==='Escape' && !isAge){ closeDialog(); return; } if(event.key!=='Tab') return; var items=getFocusable(dialog); if(!items.length) return; if(event.shiftKey && document.activeElement===items[0]){event.preventDefault();items[items.length-1].focus();}else if(!event.shiftKey && document.activeElement===items[items.length-1]){event.preventDefault();items[0].focus();} }
    function handleClose(){ closeDialog(); }
    function handleOverlayClick(){ closeDialog(); }
    function handleAgeConfirm(){ if(destroyed) return; if(!designMode) safeStore(localStorage,key,String(Date.now())); closeDialog(); }
    if(shouldSuppress()) return;
    if(close) close.addEventListener('click',handleClose); if(overlay) overlay.addEventListener('click',handleOverlayClick); if(confirm) confirm.addEventListener('click',handleAgeConfirm);
    var delay=isAge||hasFreshSuccess()?0:Math.max(0,Number(root.dataset.delay)||0)*1000;
    timer=window.setTimeout(openDialog,delay);
    overlayControllers.set(root,{destroy:function(){if(destroyed)return;destroyed=true;window.clearTimeout(timer);document.removeEventListener('keydown',handleKeydown);if(close)close.removeEventListener('click',handleClose);if(overlay)overlay.removeEventListener('click',handleOverlayClick);if(confirm)confirm.removeEventListener('click',handleAgeConfirm);if(open)unlockPhase14Dialog();open=false;root.hidden=true;overlayControllers.delete(root);}});
  }
  function initPrivacy(root) { if (!root || overlayControllers.has(root)) return; var destroyed=false, button=root.querySelector('[data-privacy-dismiss]'), designMode=root.dataset.designMode==='true', days=Math.max(0,Number(root.dataset.days)||0), value=readStore(localStorage,'theme-privacy-dismissed'); if(!designMode && validTimestamp(value,days)) { root.hidden=true; return; } if(value && !validTimestamp(value,days)) safeStore(localStorage,'theme-privacy-dismissed',null); function dismiss(){if(destroyed)return;root.hidden=true;if(!designMode)safeStore(localStorage,'theme-privacy-dismissed',String(Date.now()));} if(button)button.addEventListener('click',dismiss);overlayControllers.set(root,{destroy:function(){destroyed=true;if(button)button.removeEventListener('click',dismiss);overlayControllers.delete(root);}}); }
  function initLocalization(form) { if (!form || overlayControllers.has(form)) return; function handler(){form.submit();} form.querySelectorAll('[data-localization-select]').forEach(function(input){input.addEventListener('change',handler);});overlayControllers.set(form,{destroy:function(){form.querySelectorAll('[data-localization-select]').forEach(function(input){input.removeEventListener('change',handler);});overlayControllers.delete(form);}}); }
  function initAddressForms(root) { if (!root || addressControllers.has(root)) return; var cleanups=[]; root.querySelectorAll('[data-address-form]').forEach(function(form){ var country=form.querySelector('[data-address-country]'), province=form.querySelector('[data-address-province]'), wrap=form.querySelector('[data-address-province-wrap]'); if(!country||!province||!wrap)return; var preferredProvince=province.dataset.default; var defaultCountry=country.dataset.default; for(var index=0;defaultCountry&&index<country.options.length;index+=1){if(country.options[index].value===defaultCountry){country.selectedIndex=index;break;}} function update(){var option=country.options[country.selectedIndex], provinces=[], previous=preferredProvince||province.value; preferredProvince='';try{provinces=JSON.parse(option.getAttribute('data-provinces')||'[]');}catch(error){} province.replaceChildren(); provinces.forEach(function(item){var choice=document.createElement('option');choice.value=item[0];choice.textContent=item[1];if(item[0]===previous)choice.selected=true;province.appendChild(choice);}); var has=provinces.length>0;province.disabled=!has;wrap.hidden=!has;} country.addEventListener('change',update);cleanups.push(function(){country.removeEventListener('change',update);});update(); }); root.querySelectorAll('[data-address-delete]').forEach(function(form){function confirmDelete(event){if(!window.confirm('Delete this address?'))event.preventDefault();}form.addEventListener('submit',confirmDelete);cleanups.push(function(){form.removeEventListener('submit',confirmDelete);});}); addressControllers.set(root,{destroy:function(){cleanups.forEach(function(cleanup){cleanup();});addressControllers.delete(root);}}); }


  function initQuickAdd(form) {
    if(!form||quickAddControllers.has(form))return;var cleanup=[],destroyed=false,status=form.querySelector('[data-quick-add-status]');function submit(event){event.preventDefault();if(destroyed)return;var button=event.submitter||form.querySelector('button[type="submit"]');if(button)button.disabled=true;if(status)status.textContent='Adding to cart…';fetch(form.action,{method:'POST',credentials:'same-origin',headers:{'Accept':'application/json'},body:new FormData(form)}).then(function(response){if(!response.ok)throw new Error('Add failed');return response.json();}).then(function(){return cartCoordinator.refresh(document.querySelector('[data-cart-drawer]'));}).then(function(cart){if(status)status.textContent='';var drawerTarget=resolveCurrentCartDrawer();if(drawerTarget)document.dispatchEvent(new CustomEvent('theme:cart:open',{detail:{drawerId:drawerTarget.drawerId,itemCount:cart.item_count,opener:button}}));}).catch(function(){if(!destroyed&&status)status.textContent='Unable to add this item to your cart. Please try again.';}).finally(function(){if(button)button.disabled=false;});}
    form.addEventListener('submit',submit);cleanup.push(function(){form.removeEventListener('submit',submit);});quickAddControllers.set(form,{destroy:function(){destroyed=true;cleanup.forEach(function(fn){fn();});quickAddControllers.delete(form);}});
  }

  function initFaq(section) {
    if (!section || !section.matches || !section.matches('[data-faq-section]') || faqControllers.has(section)) return;
    var cleanups = [];
    if (section.dataset.singleOpen === 'true') {
      section.querySelectorAll('details').forEach(function (item) {
        var handler = function () {
          if (!item.open) return;
          section.querySelectorAll('details').forEach(function (other) { if (other !== item) other.open = false; });
        };
        item.addEventListener('toggle', handler);
        cleanups.push(function () { item.removeEventListener('toggle', handler); });
      });
    }
    faqControllers.set(section, { destroy: function () { cleanups.forEach(function (cleanup) { cleanup(); }); faqControllers.delete(section); } });
  }

  function initShare(root) {
    if (!root || !root.matches || !root.matches('.social-sharing') || shareControllers.has(root)) return;
    var button = root.querySelector('[data-copy-link]');
    var destroyed = false;
    var status = root.querySelector('[data-copy-status]');
    if (!button) return;
    function announce(message) { if (destroyed || !root.isConnected) return; if (status) status.textContent = message; }
    function fallbackCopy(value) {
      if (destroyed || !root.isConnected) return false;
      var field = document.createElement('textarea');
      field.value = value; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0';
      document.body.appendChild(field); field.select();
      var copied = false;
      try { copied = document.execCommand('copy'); } catch (error) { copied = false; }
      document.body.removeChild(field);
      return copied;
    }
    function copy() {
      var value = button.getAttribute('data-copy-url') || '';
      if (!value) { announce('Unable to copy the link.'); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { announce('Link copied.'); }, function () { announce(fallbackCopy(value) ? 'Link copied.' : 'Unable to copy the link.'); });
      } else announce(fallbackCopy(value) ? 'Link copied.' : 'Unable to copy the link.');
    }
    button.addEventListener('click', copy);
    button.hidden = false;
    shareControllers.set(root, { destroy: function () { destroyed = true; button.removeEventListener('click', copy); if (root.isConnected) { button.hidden = true; if (status) status.textContent = ''; } shareControllers.delete(root); } });
  }

  function destroyContent(scope) {
    var root = scope || document, items = [];
    function add(item) { if (item && items.indexOf(item) === -1) items.push(item); }
    if (root.matches && root.matches('[data-faq-section], .social-sharing')) add(root);
    root.querySelectorAll('[data-faq-section], .social-sharing').forEach(add);
    items.forEach(function (item) { var controller = item.matches('[data-faq-section]') ? faqControllers.get(item) : shareControllers.get(item); if (controller && controller.destroy) controller.destroy(); });
  }

  function destroyDynamic(scope) { var root = scope || document, phaseItems=[]; function addPhase(item){if(item&&phaseItems.indexOf(item)===-1)phaseItems.push(item);} if(root.matches&&root.matches('[data-promotion-popup], [data-age-gate], [data-privacy-banner], [data-localization-form]'))addPhase(root); root.querySelectorAll('[data-promotion-popup], [data-age-gate], [data-privacy-banner], [data-localization-form]').forEach(addPhase); phaseItems.forEach(function(item){var c=overlayControllers.get(item);if(c)c.destroy();}); if(root.matches&&root.matches('[data-addresses-section]')){var ac=addressControllers.get(root);if(ac)ac.destroy();} root.querySelectorAll('[data-addresses-section]').forEach(function(item){var ac=addressControllers.get(item);if(ac)ac.destroy();}); [selectors.slideshow, selectors.countdown, selectors.video].forEach(function (selector) { var items = []; if (root.matches && root.matches(selector)) items.push(root); Array.prototype.slice.call(root.querySelectorAll(selector)).forEach(function (item) { items.push(item); }); items.forEach(function (item) { var controller = (selector === selectors.slideshow ? slideshowControllers : (selector === selectors.countdown ? countdownControllers : videoControllers)).get(item); if (controller) controller.destroy(); }); }); var browses = []; if (root.matches && root.matches('[data-browse-section]')) browses.push(root); Array.prototype.slice.call(root.querySelectorAll('[data-browse-section]')).forEach(function (item) { browses.push(item); }); browses.forEach(function (item) { var controller = browseControllers.get(item); if (controller) controller.destroy(); }); var drawers = []; if (root.matches && root.matches('[data-cart-drawer]')) drawers.push(root); Array.prototype.slice.call(root.querySelectorAll('[data-cart-drawer]')).forEach(function(item){drawers.push(item);}); drawers.forEach(function(item){var controller=cartDrawerControllers.get(item);if(controller)controller.destroy();}); var carts = []; if (root.matches && root.matches('[data-cart-section]')) carts.push(root); Array.prototype.slice.call(root.querySelectorAll('[data-cart-section]')).forEach(function (item) { carts.push(item); }); carts.forEach(function (item) { var controller = cartControllers.get(item); if (controller) controller.destroy(); });
    var quickAdds = []; if (root.matches && root.matches('[data-cart-quick-add]')) quickAdds.push(root); Array.prototype.slice.call(root.querySelectorAll('[data-cart-quick-add]')).forEach(function(item){quickAdds.push(item);}); quickAdds.forEach(function(item){var controller=quickAddControllers.get(item);if(controller)controller.destroy();});
    var products = []; if (root.matches && root.matches('[data-product-section]')) products.push(root); Array.prototype.slice.call(root.querySelectorAll('[data-product-section]')).forEach(function (item) { products.push(item); }); products.forEach(function (item) { var controller = productControllers.get(item); if (controller) controller.destroy(); }); }

  function init(scope) {
    var root = scope || document;
    if (root !== document && root.matches && root.matches(selectors.header)) initHeader(root);
    root.querySelectorAll(selectors.header).forEach(initHeader);
    if (root !== document && root.matches && root.matches('[data-predictive-search]')) initPredictiveSearch(root);
    root.querySelectorAll('[data-predictive-search]').forEach(initPredictiveSearch);
    if (root !== document && root.matches && root.matches(selectors.announcement)) initAnnouncement(root);
    root.querySelectorAll(selectors.announcement).forEach(initAnnouncement);
    if (root !== document && root.matches && root.matches(selectors.slideshow)) initSlideshow(root);
    root.querySelectorAll(selectors.slideshow).forEach(initSlideshow);
    if (root !== document && root.matches && root.matches(selectors.countdown)) initCountdown(root);
    root.querySelectorAll(selectors.countdown).forEach(initCountdown);
    if (root !== document && root.matches && root.matches(selectors.video)) initVideo(root);
    root.querySelectorAll(selectors.video).forEach(initVideo);
    if (root !== document && root.matches && root.matches('[data-browse-section]')) initBrowse(root);
    root.querySelectorAll('[data-browse-section]').forEach(initBrowse);
    if (root !== document && root.matches && root.matches('[data-cart-section]')) initCart(root);
    root.querySelectorAll('[data-cart-section]').forEach(initCart);
    if (root !== document && root.matches && root.matches('[data-cart-drawer]')) initCartDrawer(root);
    root.querySelectorAll('[data-cart-drawer]').forEach(initCartDrawer);
    if (root !== document && root.matches && root.matches('[data-cart-quick-add]')) initQuickAdd(root);
    root.querySelectorAll('[data-cart-quick-add]').forEach(initQuickAdd);
    if (root !== document && root.matches && root.matches('[data-product-section]')) initProduct(root);
    root.querySelectorAll('[data-product-section]').forEach(initProduct);
    if (root !== document && root.matches && root.matches('[data-faq-section]')) initFaq(root);
    root.querySelectorAll('[data-faq-section]').forEach(initFaq);
    if (root !== document && root.matches && root.matches('.social-sharing')) initShare(root);
    if (root !== document && root.matches && root.matches('[data-promotion-popup], [data-age-gate]')) initOverlay(root); root.querySelectorAll('[data-promotion-popup], [data-age-gate]').forEach(initOverlay);
    if (root !== document && root.matches && root.matches('[data-privacy-banner]')) initPrivacy(root); root.querySelectorAll('[data-privacy-banner]').forEach(initPrivacy);
    if (root !== document && root.matches && root.matches('[data-localization-form]')) initLocalization(root); root.querySelectorAll('[data-localization-form]').forEach(initLocalization);
    if (root !== document && root.matches && root.matches('[data-addresses-section]')) initAddressForms(root); root.querySelectorAll('[data-addresses-section]').forEach(initAddressForms);
    root.querySelectorAll('.social-sharing').forEach(initShare);
    syncCartDrawerTriggers();
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
    syncCartDrawerTriggers();
    destroyAnnouncements(event.target);
    destroyPredictiveSearch(event.target);
    destroyHeaders(event.target);
    destroyContent(event.target);

    if (revealObserver) {
      var revealItems = Array.prototype.slice.call(event.target.querySelectorAll(selectors.reveal));
      if (event.target.matches && event.target.matches(selectors.reveal)) revealItems.unshift(event.target);
      revealItems.forEach(function (item) {
        revealObserver.unobserve(item);
      });
    }
  });
}());
