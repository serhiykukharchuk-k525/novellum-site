(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;
  var typewriterCanvas = null;

  window.addEventListener('DOMContentLoaded', function () {
    if (!prefersReduced) initSmoothScroll();
    if (!prefersReduced) {
      initHeroTrustStagger();
      initTimelineEnhancements();
      initTypewriters();
      initPhone3d();
    }
    initDemoFrameScale();
    initCalcHintAlign();
  });

  // ── 0. SMOOTH INERTIAL SCROLL (Lenis) ────────────────────────
  // Gives the page the same weighted, eased scroll feel as sites like
  // akaru.fr, instead of the browser's default 1:1 wheel scroll.
  function initSmoothScroll() {
    if (typeof window.Lenis !== 'function' || isMobile) return;

    var lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      link.addEventListener('click', function (e) {
        var target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { duration: 1.2 });
      });
    });
  }

  // ── 0a. CALCULATOR HINT ALIGNMENT (desktop) ──────────────────
  // Aligns the first hint paragraph's bottom edge with the bottom of the
  // "Запитати деталі" button in the neighboring results column.
  function initCalcHintAlign() {
    var hint = document.getElementById('calcHintFirst');
    var btn = document.getElementById('calcDetailsBtn');
    if (!hint || !btn) return;

    function update() {
      if (window.innerWidth < 768) {
        hint.style.marginTop = '';
        return;
      }
      hint.style.marginTop = '14px';
      var hintRect = hint.getBoundingClientRect();
      var btnBottom = btn.getBoundingClientRect().bottom;
      var targetTop = btnBottom - hintRect.height;
      var delta = targetTop - hintRect.top;
      var currentMargin = parseFloat(hint.style.marginTop) || 14;
      hint.style.marginTop = Math.max(14, currentMargin + delta) + 'px';
    }
    update();
    window.addEventListener('resize', update, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  }

  // ── 0b. DEMO IFRAME SCALE (mobile) ───────────────────────────
  // Stretches the wrapper to the full viewport width (breaking out of the
  // container's side padding) using pixel measurements rather than vw, so
  // there's no clipping from vw/scrollbar rounding mismatches.
  function initDemoFrameScale() {
    var wrap = document.getElementById('demoFrameWrap');
    if (!wrap || !isMobile) return;
    var NATIVE_W = 980, NATIVE_H = 600;

    function update() {
      wrap.style.width = '';
      wrap.style.marginLeft = '';
      wrap.style.marginRight = '';
      var rect = wrap.getBoundingClientRect();
      var viewportW = document.documentElement.clientWidth;
      wrap.style.width = viewportW + 'px';
      wrap.style.marginLeft = -rect.left + 'px';
      wrap.style.marginRight = -(viewportW - rect.right) + 'px';

      var w = viewportW;
      if (!w) return;
      var scale = w / NATIVE_W;
      wrap.style.setProperty('--demo-scale', scale.toFixed(4));
      wrap.style.setProperty('--demo-scaled-h', Math.round(NATIVE_H * scale) + 'px');
    }
    update();
    window.addEventListener('resize', update, { passive: true });
  }

  // ── 2. HERO TRUST STRIP STAGGER ──────────────────────────────
  function initHeroTrustStagger() {
    var items = document.querySelectorAll('.hero-trust-item');
    items.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('vis'); }, 800 + i * 150);
    });
  }

  // ── 3. PROCESS WAVE ──────────────────────────────────────────
  function initProcessWave() {
    var sec = document.querySelector('#process');
    if (!sec) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'process-wave';
    sec.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = sec.clientWidth || window.innerWidth;
      canvas.height = 140;
    }
    resize();
    window.addEventListener('resize', function () { resize(); }, { passive: true });

    var waves = [
      { amp: 14, freq: .018, speed: .55, yBase: .62, alpha: .10 },
      { amp: 10, freq: .025, speed: .80, yBase: .76, alpha: .08 },
      { amp:  7, freq: .033, speed: 1.1, yBase: .90, alpha: .06 },
    ];
    if (isMobile) waves = [waves[0]];

    function draw() {
      var t = performance.now() / 1000;
      var W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      waves.forEach(function (w) {
        ctx.beginPath();
        for (var x = 0; x <= W; x += 2) {
          var y = H * w.yBase + Math.sin(x * w.freq + t * w.speed) * w.amp;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
        ctx.fillStyle = 'rgba(212,184,134,' + w.alpha + ')';
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ── 4. TIMELINE ENHANCEMENTS ─────────────────────────────────
  function initTimelineEnhancements() {
    var tlDiv = document.querySelector('.process-timeline');
    if (!tlDiv) return;

    // Wrap in side-container for hairline + dots
    var wrapper = document.createElement('div');
    wrapper.className = 'tl-side-wrapper';
    tlDiv.parentNode.insertBefore(wrapper, tlDiv);
    wrapper.appendChild(tlDiv);

    var hairline = document.createElement('div');
    hairline.className = 'tl-hairline';
    wrapper.insertBefore(hairline, wrapper.firstChild);

    var tlItems = tlDiv.querySelectorAll('.process-step');
    var dots = [];

    // Measure after layout settles. Read all offsets first, then write/append
    // in a separate pass so the loop doesn't force a reflow per iteration.
    requestAnimationFrame(function () {
      var tops = [];
      tlItems.forEach(function (item) { tops.push(item.offsetTop); });
      tlItems.forEach(function (item, i) {
        var dot = document.createElement('div');
        dot.className = 'tl-dot';
        dot.style.top = (tops[i] + 16) + 'px';
        wrapper.appendChild(dot);
        dots.push(dot);
      });
    });

    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      hairline.classList.add('is-visible');
      dots.forEach(function (dot, i) {
        setTimeout(function () { dot.classList.add('is-visible'); }, 280 + i * 230);
      });
      io.unobserve(wrapper);
    }, { threshold: 0.15 });
    io.observe(wrapper);
  }

  // ── 5. TYPEWRITERS ([data-typewriter]) ───────────────────────
  function initTypewriters() {
    document.querySelectorAll('[data-typewriter]').forEach(function (el) {
      var texts;
      try { texts = JSON.parse(el.dataset.typewriter); } catch (e) { return; }
      var idx = 0, charIdx = 0, deleting = false;

      // Reserve width/height for the tallest of the rotating strings up
      // front, so wrapping to a 2nd line mid-type never shifts content
      // below it, and the inline-block doesn't recompute its shrink-to-fit
      // width on every keystroke. Measured via <canvas>.measureText instead
      // of DOM probes — same numbers, but no forced-reflow reads
      // (offsetWidth/offsetHeight) during init.
      var elStyle = getComputedStyle(el);
      var containerWidth = el.parentElement.clientWidth;
      var canvas = typewriterCanvas || (typewriterCanvas = document.createElement('canvas'));
      var ctx = canvas.getContext('2d');
      ctx.font = elStyle.font;
      var letterSpacing = parseFloat(elStyle.letterSpacing) || 0;

      function measureText(t) {
        var w = ctx.measureText(t).width;
        if (letterSpacing) w += letterSpacing * Math.max(0, t.length - 1);
        return w;
      }

      var maxNowrapWidth = 0;
      texts.forEach(function (t) {
        maxNowrapWidth = Math.max(maxNowrapWidth, measureText(t));
      });
      // +10px safety margin: matches prior offsetWidth-rounding buffer.
      var fixedWidth = Math.min(Math.ceil(maxNowrapWidth) + 10, containerWidth);
      if (fixedWidth) el.style.width = fixedWidth + 'px';

      // Greedy word-wrap against fixedWidth to count lines per string,
      // mirroring how the DOM probe's `white-space:normal` would have
      // wrapped it — then convert line count to height via line-height.
      var wrapWidth = fixedWidth || containerWidth;
      var lineHeight = parseFloat(elStyle.lineHeight);
      if (isNaN(lineHeight)) lineHeight = parseFloat(elStyle.fontSize) * 1.2;
      var maxLines = 1;
      texts.forEach(function (t) {
        var words = t.split(' ');
        var lines = 1, lineWidth = 0;
        words.forEach(function (w, i) {
          var piece = (lineWidth === 0 ? '' : ' ') + w;
          var pieceWidth = measureText(piece);
          if (lineWidth + pieceWidth > wrapWidth && lineWidth > 0) {
            lines++;
            lineWidth = measureText(w);
          } else {
            lineWidth += pieceWidth;
          }
        });
        maxLines = Math.max(maxLines, lines);
      });
      var maxHeight = maxLines * lineHeight;
      // Fix height outright (not just min-height) with a rounding buffer
      // and clip overflow — any sub-pixel wrap difference between
      // intermediate substrings otherwise nudges the box by a fraction of
      // a pixel on every keystroke, which on real device pixel ratios
      // rounds to a visible 1px shake of everything below it.
      if (maxHeight) {
        el.style.height = (Math.ceil(maxHeight) + 2) + 'px';
        el.style.overflow = 'hidden';
      }

      function type() {
        var cur = texts[idx];
        if (!deleting) {
          el.textContent = cur.slice(0, ++charIdx);
          if (charIdx === cur.length) {
            deleting = true;
            return setTimeout(type, 1800);
          }
        } else {
          el.textContent = cur.slice(0, --charIdx);
          if (charIdx === 0) {
            deleting = false;
            idx = (idx + 1) % texts.length;
          }
        }
        setTimeout(type, deleting ? 40 : 60);
      }

      // Delay past the .reveal slide-up transition (.6s, triggered at a
      // lower threshold) so typing doesn't start while the section is
      // still animating into place — avoids a visible jolt.
      // If the element was pre-filled in HTML (SEO fallback), resume from
      // the end of the first string so the animation doesn't flash back to
      // a single character before retyping — visually seamless.
      if (el.textContent.trim() === texts[0]) charIdx = texts[0].length - 1;

      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { setTimeout(type, 650); obs.unobserve(el); }
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  // ── 8. 3D PHONE (#phone3dDemo) ───────────────────────────────
  function initPhone3d() {
    var el = document.getElementById('phone3dDemo');
    if (!el) return;
    var obs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      el.classList.add('on');
      obs.unobserve(el);
    }, { threshold: 0.15 });
    obs.observe(el);
  }


})();
