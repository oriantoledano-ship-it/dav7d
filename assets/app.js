/* ==========================================================================
   ДAV7Д - behaviour. No vendor code. Every animation has a no-JS / reduced-
   motion path, and the loader can never trap the page (timeout + hidden-tab
   exit), because rAF and WAAPI stall in background tabs.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.remove('no-js');
  var $ = function (id) { return document.getElementById(id); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches ||
               root.getAttribute('data-motion') === 'off';
  var fine = matchMedia('(pointer: fine)').matches;

  /* ---------- loader: letters stitched in behind a needle, stars spun on,
     then the whole mark flies into the nav slot ---------- */
  function initLoader(onReveal) {
    var ldr = $('ldr');
    var revealed = false;
    var reveal = function () { if (!revealed) { revealed = true; onReveal(); } };
    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      root.classList.remove('is-loading');
      if (ldr && ldr.parentNode) ldr.parentNode.removeChild(ldr);
      reveal();
    };
    if (!ldr || reduce || document.hidden || !ldr.animate) { finish(); return; }

    setTimeout(finish, 5600);
    document.addEventListener('visibilitychange', function () { if (document.hidden) finish(); });

    var logo = $('ldrLogo'), letters = $('ldrLetters'), needle = $('ldrNeedle'), seam = $('ldrSeam');
    var starL = $('ldrStarL'), starR = $('ldrStarR'), count = $('ldrCount'), meta = $('ldrMeta'), bg = $('ldrBg');
    var D = 1500, sew = 'cubic-bezier(.65,0,.35,1)', fwd = 'forwards';

    letters.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: D, easing: sew, fill: fwd });
    needle.animate([{ left: '0%', opacity: 1 }, { left: '100%', opacity: 1 }], { duration: D, easing: sew, fill: fwd });
    seam.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: D, easing: sew, fill: fwd });
    var spin = [{ opacity: 0, transform: 'rotate(-150deg) scale(.25)' }, { opacity: 1, transform: 'rotate(0deg) scale(1)' }];
    var pop = 'cubic-bezier(.34,1.45,.64,1)';
    starL.animate(spin, { duration: 900, delay: 180, easing: pop, fill: fwd });
    starR.animate(spin, { duration: 900, delay: 1120, easing: pop, fill: fwd });

    var t0 = performance.now();
    (function tick() {
      var p = Math.min(1, (performance.now() - t0) / 2050);
      count.textContent = ('00' + Math.round(p * 100)).slice(-3);
      if (p < 1 && !finished) requestAnimationFrame(tick);
    })();

    var minTime = new Promise(function (r) { setTimeout(r, 2150); });
    var loaded = new Promise(function (r) {
      if (document.readyState === 'complete') r();
      else addEventListener('load', r);
      setTimeout(r, 3600);
    });

    Promise.all([minTime, loaded]).then(function () {
      if (finished) return;
      var soft = { duration: 260, fill: fwd };
      needle.animate([{ opacity: 1 }, { opacity: 0 }], soft);
      seam.animate([{ opacity: 1 }, { opacity: 0 }], soft);
      meta.animate([{ opacity: 1 }, { opacity: 0 }], soft);

      var target = $('navLogo');
      var a = logo.getBoundingClientRect(), b = target ? target.getBoundingClientRect() : null;
      if (!b || !b.width) { finish(); return; }
      var s = b.width / a.width;
      var fly = logo.animate(
        [{ transform: 'none' }, { transform: 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px) scale(' + s + ')' }],
        { duration: 1050, delay: 120, easing: 'cubic-bezier(.76,0,.24,1)', fill: fwd });
      bg.animate([{ clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
        { duration: 1000, delay: 220, easing: 'cubic-bezier(.76,0,.24,1)', fill: fwd });
      setTimeout(reveal, 520);
      fly.onfinish = finish;
    });
  }

  /* ---------- hero entrance (setTimeout, not rAF, so hidden tabs still get it) ---------- */
  function heroIn() {
    var h1 = $('heroH1');
    if (h1) h1.classList.add('is-live');
    var parts = document.querySelectorAll('.hero .rise, .hero .clip');
    [].forEach.call(parts, function (el, i) {
      el.style.transitionDelay = (reduce ? 0 : 0.18 + i * 0.1) + 's';
      el.classList.add('in');
    });
  }

  /* ---------- announcement strip: exact-pixel seamless loop ---------- */
  function initStrip() {
    var track = $('stripTrack');
    if (!track) return;
    var n = track.children.length, html = track.innerHTML;
    track.innerHTML = html + html;
    var guard = 0;
    while (track.offsetWidth < innerWidth * 2.2 && guard++ < 6) track.innerHTML += html;
    function measure() {
      var d = Math.abs(track.children[n].getBoundingClientRect().left - track.children[0].getBoundingClientRect().left);
      if (d > 0) {
        track.style.setProperty('--d', d + 'px');
        track.style.animationDuration = (d / 55).toFixed(2) + 's';
      }
    }
    measure();
    addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    if (reduce) track.style.animation = 'none';
  }

  /* ---------- nav, drawer, mobile CTA ---------- */
  function initChrome() {
    var nav = $('nav'), burger = $('burger'), drawer = $('drawer'), mcta = $('mcta'), hero = $('top');
    function setDrawer(open) {
      drawer.classList.toggle('is-open', open);
      nav.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'סגירת תפריט' : 'פתיחת תפריט');
      document.body.style.overflow = open ? 'hidden' : '';
      document.body.classList.toggle('drawer-on', open);
    }
    if (burger && drawer) {
      burger.addEventListener('click', function () { setDrawer(!drawer.classList.contains('is-open')); });
      drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drawer.classList.contains('is-open')) { setDrawer(false); burger.focus(); }
      });
    }
    function onScroll() {
      var y = scrollY;
      nav.classList.toggle('is-stuck', y > 40);
      if (mcta && hero) {
        var show = y > hero.offsetHeight * 0.8;
        mcta.classList.toggle('on', show);
        document.body.classList.toggle('mcta-on', show);
        mcta.setAttribute('aria-hidden', show ? 'false' : 'true');
        mcta.setAttribute('tabindex', show ? '0' : '-1');
      }
    }
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- scroll reveals ---------- */
  function initReveals() {
    var els = [].slice.call(document.querySelectorAll('.rise, .clip, .order__h')).filter(function (el) {
      return !el.closest('.hero');
    });
    var show = function (el) {
      if (el.classList.contains('order__h')) el.classList.add('is-live');
      else el.classList.add('in');
    };
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var idx = el.parentElement ? [].indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = Math.min(Math.max(idx, 0), 4) * 0.08 + 's';
        show(el);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) show(el);
      });
    }, 3200);
  }

  /* ---------- hero parallax ---------- */
  function initParallax() {
    if (reduce || !fine) return;
    var imgs = [].slice.call(document.querySelectorAll('[data-par]'));
    if (!imgs.length) return;
    var raf = 0;
    function apply() {
      raf = 0;
      imgs.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        var off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(img.getAttribute('data-par'));
        img.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    }
    apply();
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(apply); }, { passive: true });
  }

  /* ---------- "out there": pinned horizontal scrub on wide + mouse screens,
     native swipe everywhere else ---------- */
  function initField() {
    var sec = $('field'), view = $('fieldView'), track = $('fieldTrack');
    if (!sec || !track) return;
    var mq = matchMedia('(min-width: 981px) and (pointer: fine)');
    var on = false, dist = 0, raf = 0;
    function update() {
      raf = 0;
      if (!on) return;
      var span = sec.offsetHeight - innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / span)) : 0;
      // RTL: the strip overflows to the left, so it travels rightwards
      track.style.transform = 'translate3d(' + (p * dist).toFixed(1) + 'px,0,0)';
    }
    function setup() {
      on = mq.matches && !reduce;
      sec.classList.toggle('field--pin', on);
      if (!on) { sec.style.height = ''; track.style.transform = ''; return; }
      dist = Math.max(0, track.offsetWidth - view.clientWidth);
      sec.style.height = (innerHeight + dist) + 'px';
      update();
    }
    setup();
    addEventListener('resize', setup);
    addEventListener('load', setup);
    addEventListener('scroll', function () { if (on && !raf) raf = requestAnimationFrame(update); }, { passive: true });
  }

  /* ---------- in-page anchors ---------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  function boot() {
    var y = $('yr');
    if (y) y.textContent = new Date().getFullYear();
    initChrome(); initStrip(); initReveals(); initParallax(); initField(); initAnchors();
    initLoader(heroIn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
