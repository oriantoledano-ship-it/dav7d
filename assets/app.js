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
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* one scroll loop shared by every scroll-linked effect */
  var onScrollFns = [];
  var lastY = scrollY, vel = 0, ticking = false;
  function runScroll() {
    ticking = false;
    var y = scrollY;
    vel = y - lastY;
    lastY = y;
    for (var i = 0; i < onScrollFns.length; i++) onScrollFns[i](y, vel);
  }
  addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(runScroll); }
  }, { passive: true });

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
    var seal = $('seal');
    if (seal && seal.animate && !reduce) {
      seal.animate([{ opacity: 0, transform: 'scale(.4) rotate(-90deg)' }, { opacity: 1, transform: 'scale(1) rotate(0deg)' }],
        { duration: 1100, delay: 650, easing: 'cubic-bezier(.34,1.3,.64,1)', fill: 'backwards' });
    }
  }

  /* ---------- headings: split into letters inside word masks ---------- */
  function initSplit() {
    document.querySelectorAll('.split').forEach(function (h) {
      var text = h.textContent.trim();
      h.setAttribute('aria-label', text);
      var wrap = document.createElement('span');
      wrap.setAttribute('aria-hidden', 'true');
      var i = 0;
      text.split(/\s+/).forEach(function (word, wi) {
        if (wi) wrap.appendChild(document.createTextNode(' '));
        var w = document.createElement('span');
        w.className = 'w';
        Array.from(word).forEach(function (c) {
          var ch = document.createElement('span');
          ch.className = 'ch';
          ch.style.setProperty('--i', i++);
          ch.textContent = c;
          w.appendChild(ch);
        });
        wrap.appendChild(w);
      });
      h.textContent = '';
      h.appendChild(wrap);
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

  /* ---------- velocity band: drifts on its own, scroll whips it and
     flips its direction, and the letters lean into the speed ---------- */
  function initBand() {
    var track = $('bandTrack');
    if (!track || reduce) return;
    var n = track.children.length, html = track.innerHTML;
    track.innerHTML = html + html + html;
    var d = 0, x = 0, dir = -1, boost = 0, skew = 0, visible = false, last = 0, running = false;
    function measure() {
      d = Math.abs(track.children[n].getBoundingClientRect().left - track.children[0].getBoundingClientRect().left);
    }
    measure();
    addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
    onScrollFns.push(function (y, v) {
      if (v) dir = v > 0 ? -1 : 1;
      boost = clamp(boost + Math.abs(v) * 0.9, 0, 60);
    });
    function frame(t) {
      if (!visible) { running = false; return; }
      var dt = last ? Math.min(64, t - last) : 16;
      last = t;
      boost *= 0.92;
      x += dir * (0.9 + boost * 0.35) * dt / 16;
      if (d) { if (x <= -d) x += d; if (x > 0) x -= d; }
      skew += ((dir * -boost * 0.12) - skew) * 0.15;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0) skewX(' + clamp(skew, -9, 9).toFixed(2) + 'deg)';
      requestAnimationFrame(frame);
    }
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !running) { running = true; last = 0; requestAnimationFrame(frame); }
    }).observe(track.parentElement);
  }

  /* ---------- nav + drawer ---------- */
  function initChrome() {
    var nav = $('nav'), burger = $('burger'), drawer = $('drawer');
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
    var stuck = function (y) { nav.classList.toggle('is-stuck', y > 40); };
    stuck(scrollY);
    onScrollFns.push(stuck);
  }

  /* ---------- scroll reveals ---------- */
  function initReveals() {
    var els = [].slice.call(document.querySelectorAll('.rise, .clip, .split, .order__h')).filter(function (el) {
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
        if (!el.classList.contains('split')) {
          var idx = el.parentElement ? [].indexOf.call(el.parentElement.children, el) : 0;
          el.style.transitionDelay = Math.min(Math.max(idx, 0), 4) * 0.08 + 's';
        }
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

  /* ---------- scroll-linked: hero parallax, seal spin, art zoom, footer stitch ---------- */
  function initScrollFx() {
    if (reduce) return;
    var par = fine ? [].slice.call(document.querySelectorAll('[data-par]')) : [];
    var seal = $('seal');
    var art = document.querySelector('.story__art img');
    var mark = $('footMark');
    function fx(y, v) {
      par.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        var off = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(img.getAttribute('data-par'));
        img.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
      if (seal) seal.style.transform = 'rotate(' + (y * 0.14).toFixed(1) + 'deg)';
      if (art) {
        var ar = art.parentElement.getBoundingClientRect();
        if (ar.bottom > 0 && ar.top < innerHeight) {
          var p = clamp(1 - (ar.top + ar.height) / (innerHeight + ar.height), 0, 1);
          art.style.transform = 'scale(' + (1.16 - p * 0.16).toFixed(3) + ')';
        }
      }
      if (mark) {
        var mr = mark.getBoundingClientRect();
        var q = clamp((innerHeight - mr.top) / (innerHeight * 0.7), 0, 1);
        mark.style.setProperty('--fr', ((1 - q) * 100).toFixed(1) + '%');
      }
    }
    fx(scrollY, 0);
    onScrollFns.push(fx);
    addEventListener('resize', function () { fx(scrollY, 0); });
  }

  /* ---------- "out there": pinned horizontal scrub on wide + mouse screens,
     native swipe everywhere else; a progress line tracks either ---------- */
  function initField() {
    var sec = $('field'), view = $('fieldView'), track = $('fieldTrack'), bar = $('fieldBar');
    if (!sec || !track) return;
    var hint = sec.querySelector('.field__hint');
    var mq = matchMedia('(min-width: 981px) and (pointer: fine)');
    var on = false, dist = 0;
    function setBar(p) { if (bar) bar.style.setProperty('--fp', clamp(p, 0, 1).toFixed(3)); }
    function update() {
      if (!on) return;
      var span = sec.offsetHeight - innerHeight;
      var p = span > 0 ? clamp(-sec.getBoundingClientRect().top / span, 0, 1) : 0;
      // RTL: the strip overflows to the left, so it travels rightwards
      track.style.transform = 'translate3d(' + (p * dist).toFixed(1) + 'px,0,0)';
      setBar(p);
    }
    function setup() {
      on = mq.matches && !reduce;
      sec.classList.toggle('field--pin', on);
      if (bar && hint) bar.style.setProperty('--hintw', on ? '0px' : (hint.offsetWidth + 16) + 'px');
      if (!on) { sec.style.height = ''; track.style.transform = ''; return; }
      dist = Math.max(0, track.offsetWidth - view.clientWidth);
      sec.style.height = (innerHeight + dist) + 'px';
      update();
    }
    view.addEventListener('scroll', function () {
      if (on) return;
      var max = view.scrollWidth - view.clientWidth;
      setBar(max > 0 ? Math.abs(view.scrollLeft) / max : 0);
    }, { passive: true });
    setup();
    addEventListener('resize', setup);
    addEventListener('load', setup);
    onScrollFns.push(update);
  }

  /* ---------- product cards: tilt + light that follows the pointer ---------- */
  function initTilt() {
    if (!fine || reduce) return;
    document.querySelectorAll('.prod__media').forEach(function (m) {
      m.addEventListener('pointermove', function (e) {
        var r = m.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        m.style.transform = 'perspective(900px) rotateY(' + ((px - 0.5) * 9).toFixed(2) + 'deg) rotateX(' + ((0.5 - py) * 7).toFixed(2) + 'deg)';
        m.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        m.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      m.addEventListener('pointerleave', function () { m.style.transform = ''; });
    });
  }

  /* ---------- mobile product swipe dots ---------- */
  function initDots() {
    var grid = $('grid'), dots = $('gridDots');
    if (!grid || !dots) return;
    var ds = dots.children;
    grid.addEventListener('scroll', function () {
      var card = grid.children[0];
      if (!card) return;
      var step = card.getBoundingClientRect().width + parseFloat(getComputedStyle(grid).columnGap || 0);
      var k = clamp(Math.round(Math.abs(grid.scrollLeft) / step), 0, ds.length - 1);
      for (var i = 0; i < ds.length; i++) ds[i].classList.toggle('on', i === k);
    }, { passive: true });
  }

  /* ---------- custom cursor (mouse only) ---------- */
  function initCursor() {
    var cur = $('cur'), txt = $('curTxt');
    if (!cur || !fine || reduce) return;
    root.classList.add('has-cur');
    var dot = cur.querySelector('.cur__dot'), ring = cur.querySelector('.cur__ring');
    var mx = -100, my = -100, rx = -100, ry = -100, live = false;
    addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      if (!live) { live = true; rx = mx; ry = my; requestAnimationFrame(follow); }
    }, { passive: true });
    function follow() {
      rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      requestAnimationFrame(follow);
    }
    document.addEventListener('pointerover', function (e) {
      var lab = e.target.closest('[data-cursor]');
      var link = e.target.closest('a, button');
      cur.classList.toggle('is-label', !!lab);
      cur.classList.toggle('is-link', !lab && !!link);
      if (lab) txt.textContent = lab.getAttribute('data-cursor');
    });
    document.addEventListener('pointerleave', function () { cur.style.opacity = '0'; });
    document.addEventListener('pointerenter', function () { cur.style.opacity = ''; });
  }

  /* ---------- magnetic CTA ---------- */
  function initMagnetic() {
    if (!fine || reduce) return;
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px,' +
                                            ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
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
    initSplit();
    initChrome(); initStrip(); initBand(); initReveals(); initScrollFx(); initField();
    initTilt(); initDots(); initCursor(); initMagnetic(); initAnchors();
    initLoader(heroIn);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
