/* =========================
   app.js – Vector Electrical
   ========================= */

/* ---------- 0) Helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- 1) Navbar: sticky hide/show + size sync ---------- */
(function () {
  const nav = $('#siteNav');
  if (!nav) return;

  const getScrollY = () =>
    window.pageYOffset || document.documentElement.scrollTop || 0;

  const setNavHeightVar = () => {
    const h = nav.offsetHeight;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  };

  // init sizing
  window.addEventListener('load', setNavHeightVar, { once: true });
  window.addEventListener('resize', setNavHeightVar);
  document.addEventListener('shown.bs.collapse', setNavHeightVar);
  document.addEventListener('hidden.bs.collapse', setNavHeightVar);

  let lastY = getScrollY();
  const HIDE_THRESHOLD = 10;   // px before toggling
  const SCROLL_TRIGGER = 4;    // add bg/shadow after a tiny scroll

  function onScroll() {
    const y = getScrollY();

    // background/shadow after tiny scroll
    if (y > SCROLL_TRIGGER) nav.classList.add('nav-scrolled');
    else nav.classList.remove('nav-scrolled');

    // hide on down, show on up
    if (y > lastY + HIDE_THRESHOLD) {
      nav.classList.add('nav-hidden');
    } else if (y < lastY - HIDE_THRESHOLD) {
      nav.classList.remove('nav-hidden');
    }
    lastY = y;
  }

  // Touch support for mobile address-bar jitter
  let lastTouchY = null;
  function onTouchStart(e) {
    if (e.touches && e.touches.length) lastTouchY = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (e.touches && e.touches.length && lastTouchY !== null) {
      const current = e.touches[0].clientY;
      const delta = current - lastTouchY; // >0 finger moved down
      if (delta > 8) nav.classList.remove('nav-hidden');
      else if (delta < -8) nav.classList.add('nav-hidden');
      lastTouchY = current;
    }
  }

  // ensure visible on load
  nav.classList.remove('nav-hidden');

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: true });

  // initial state if page loads mid-scroll (restored position)
  window.addEventListener('load', () => {
    const y = getScrollY();
    if (y > SCROLL_TRIGGER) nav.classList.add('nav-scrolled');
    setNavHeightVar();
  });
})();

/* ---------- 2) Fix hover “sticking” on touch devices ---------- */
(function () {
  let isTouch = false;
  function handleTouchStart() {
    if (!isTouch) {
      isTouch = true;
      document.body.classList.add('no-hover');
      setTimeout(() => {
        document.body.classList.remove('no-hover');
        isTouch = false;
      }, 1000);
    }
  }
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
})();

/* ---------- 3) Close navbar when tapping/clicking outside ---------- */
(function () {
  const navCollapse = $('.navbar-collapse');
  const toggleButton = $('.navbar-toggler');
  if (!navCollapse || !toggleButton) return;

  let outsideHandler = null;

  function onShown() {
    // wait a tick so the collapse finishes laying out
    setTimeout(() => {
      outsideHandler = (e) => {
        const clickedInsideNav = navCollapse.contains(e.target);
        const clickedToggle = toggleButton.contains(e.target);

        if (!clickedInsideNav && !clickedToggle) {
          const bsCollapse =
            bootstrap.Collapse.getInstance(navCollapse) ||
            new bootstrap.Collapse(navCollapse, { toggle: false });
          bsCollapse.hide();
        }
      };

      document.addEventListener('click', outsideHandler, { passive: true });
      document.addEventListener('touchstart', outsideHandler, { passive: true });
    }, 0);
  }

  function onHidden() {
    if (outsideHandler) {
      document.removeEventListener('click', outsideHandler);
      document.removeEventListener('touchstart', outsideHandler);
      outsideHandler = null;
    }
  }

  navCollapse.addEventListener('shown.bs.collapse', onShown);
  navCollapse.addEventListener('hidden.bs.collapse', onHidden);
})();

/* ---------- 4) Blur active element after taps (avoid stuck focus) ---------- */
document.addEventListener(
  'touchend',
  (e) => {
    const tappable = e.target.closest('a, button, .nav-link, .dropdown-item, .power-link');
    if (tappable) {
      setTimeout(() => {
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
      }, 0);
    }
  },
  { passive: true }
);

/* ---------- 5) Mobile OS detection (consolidated) ---------- */
(function () {
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isIOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  document.documentElement.classList.add(isAndroid || isIOS ? 'mobile-os' : 'desktop-os');
})();

/* ---------- 6) Auto-update copyright year ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const year = new Date().getFullYear();
  const el = $('#copyright');
  if (el) el.innerHTML = `© 2023 - ${year} Vector Electrical Group LLC. All Rights Reserved.`;
});

/* ---------- 7) Lazy-load & auto-play/pause videos in view ---------- */
(function () {
  const vids = $$('video');
  if (!('IntersectionObserver' in window) || vids.length === 0) return;

  const loadVideo = (video) => {
    if (video.dataset.loaded) return;
    const src = video.querySelector('source[data-src]');
    if (src) {
      src.src = src.dataset.src;
      src.removeAttribute('data-src');
    }
    video.load();
    // Autoplay only for muted inline videos in view
    video.play().catch(() => {});
    video.dataset.loaded = '1';
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const v = e.target;
        if (e.isIntersecting) {
          loadVideo(v);
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { rootMargin: '200px 0px 200px 0px', threshold: 0.1 }
  );

  vids.forEach((v) => io.observe(v));
})();
