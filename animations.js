(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;

  window.addEventListener('DOMContentLoaded', function () {
    if (!prefersReduced) initParticleField();
    if (!prefersReduced) {
      initHeroTrustStagger();
      initProcessWave();
      initTimelineEnhancements();
      initTypewriters();
      initFlyingIcons();
      initSourcesOrbit();
      initPhone3d();
    }
  });

  // ── 1. DNA HELIX BACKGROUND (dnacapital.com style — fixed full-viewport bg) ─
  // Two offset sine strands run the height of the viewport with glowing
  // particles traveling along them, thin "base pair" rungs between the
  // strands, and a sparse field of ambient drifting particles behind it all.
  function initParticleField() {
    var heroEl = document.querySelector('.hero');
    var canvas = document.createElement('canvas');
    canvas.id = 'novellum-canvas';
    if (heroEl && heroEl.parentNode) {
      heroEl.parentNode.insertBefore(canvas, heroEl.nextSibling);
    } else {
      document.body.prepend(canvas);
    }
    var ctx = canvas.getContext('2d');
    var W, H, ratio;

    var helixAmp = isMobile ? 50 : 110;
    var helixFreq = 0.012;
    var helixSpeed = .25;
    var rungStep = isMobile ? 46 : 30;
    var strandStep = isMobile ? 7 : 4;
    var nodeCount = isMobile ? 7 : 14;
    var ambientN = isMobile ? 24 : 60;
    var ambientConnectDist = isMobile ? 45 : 70;

    var ambient = [];
    var nodesA = [], nodesB = [];

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      ratio = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
      canvas.width = W * ratio;
      canvas.height = H * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    for (var i = 0; i < ambientN; i++) {
      ambient.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - .5) * .15,
        vy: (Math.random() - .5) * .15,
        r: .5 + Math.random(),
        a: .03 + Math.random() * .12,
      });
    }
    for (var n = 0; n < nodeCount; n++) {
      nodesA.push({ phase: (n / nodeCount) * window.innerHeight, speed: .25 + Math.random() * .2 });
      nodesB.push({ phase: ((n + .5) / nodeCount) * window.innerHeight, speed: .25 + Math.random() * .2 });
    }

    function strandX(centerX, y, t, offset) {
      return centerX + Math.sin(y * helixFreq + t * helixSpeed + offset) * helixAmp;
    }

    function tick() {
      var t = performance.now() / 1000;
      ctx.clearRect(0, 0, W, H);

      // ambient drifting particles, with sparse constellation links
      for (var i = 0; i < ambientN; i++) {
        var p = ambient[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244,239,229,' + p.a.toFixed(3) + ')';
        ctx.fill();
        for (var j = i + 1; j < ambientN; j++) {
          var q = ambient[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < ambientConnectDist) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(244,239,229,' + (0.05 * (1 - d / ambientConnectDist)).toFixed(3) + ')';
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }

      // gentle diagonal drift of the whole helix
      var centerX = W / 2 + Math.sin(t * 0.05) * 24;
      var driftY = (t * 6) % rungStep;

      // base pairs between the two strands
      ctx.lineWidth = .6;
      for (var y = -driftY; y <= H; y += rungStep) {
        var ax = strandX(centerX, y, t, 0);
        var bx = strandX(centerX, y, t, Math.PI);
        ctx.beginPath();
        ctx.moveTo(ax, y);
        ctx.lineTo(bx, y);
        ctx.strokeStyle = 'rgba(212,184,134,.12)';
        ctx.stroke();
      }

      // the two strands themselves
      ctx.beginPath();
      for (var y1 = 0; y1 <= H; y1 += strandStep) {
        var sx1 = strandX(centerX, y1, t, 0);
        y1 === 0 ? ctx.moveTo(sx1, y1) : ctx.lineTo(sx1, y1);
      }
      ctx.strokeStyle = 'rgba(212,184,134,.32)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      ctx.beginPath();
      for (var y2 = 0; y2 <= H; y2 += strandStep) {
        var sx2 = strandX(centerX, y2, t, Math.PI);
        y2 === 0 ? ctx.moveTo(sx2, y2) : ctx.lineTo(sx2, y2);
      }
      ctx.strokeStyle = 'rgba(212,184,134,.22)';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // glowing nucleotide particles traveling along each strand
      drawNodes(nodesA, 0);
      drawNodes(nodesB, Math.PI);

      requestAnimationFrame(tick);
    }

    function drawNodes(nodes, offset) {
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        node.phase = (node.phase + node.speed) % H;
        var y = node.phase;
        var x = strandX(W / 2, y, performance.now() / 1000, offset);
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,184,134,.9)';
        ctx.shadowColor = 'rgba(212,184,134,.55)';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    requestAnimationFrame(tick);
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
    if (isMobile) return; // disabled on mobile to keep the DNA bg smooth
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
    var tlDiv = document.querySelector('.timeline');
    if (!tlDiv) return;

    // Wrap in side-container for hairline + dots
    var wrapper = document.createElement('div');
    wrapper.className = 'tl-side-wrapper';
    tlDiv.parentNode.insertBefore(wrapper, tlDiv);
    wrapper.appendChild(tlDiv);

    var hairline = document.createElement('div');
    hairline.className = 'tl-hairline';
    wrapper.insertBefore(hairline, wrapper.firstChild);

    var tlItems = tlDiv.querySelectorAll('.timeline-item');
    var dots = [];

    // Measure after layout settles
    requestAnimationFrame(function () {
      tlItems.forEach(function (item) {
        var dot = document.createElement('div');
        dot.className = 'tl-dot';
        dot.style.top = (item.offsetTop + 16) + 'px';
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

      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { type(); obs.unobserve(el); }
      }, { threshold: 0.5 });
      obs.observe(el);
    });
  }

  // ── 7. FLYING TOOL PILLS (#pricing) ──────────────────────────
  function initFlyingIcons() {
    var sec = document.querySelector('#pricing .container');
    if (!sec) return;

    var tools = [
      { n: 'Power BI',      tx: '-160px', ty: '-45px' },
      { n: 'Excel',         tx: '-100px', ty:  '55px' },
      { n: 'Google Sheets', tx:  '-55px', ty: '-55px' },
      { n: '1С / ERP',      tx:   '55px', ty:  '55px' },
      { n: 'CRM',           tx:  '100px', ty: '-45px' },
      { n: 'PostgreSQL',    tx:  '160px', ty:  '35px' },
      { n: 'MySQL',         tx: '-130px', ty:  '25px' },
      { n: 'Bitrix24',      tx:  '130px', ty: '-30px' },
    ];

    var orbit = document.createElement('div');
    orbit.className = 'tools-orbit';
    tools.forEach(function (t, i) {
      var pill = document.createElement('span');
      pill.className = 'tool-pill';
      pill.textContent = t.n;
      pill.style.setProperty('--tx', t.tx);
      pill.style.setProperty('--ty', t.ty);
      pill.style.setProperty('--delay', (i * 0.06) + 's');
      orbit.appendChild(pill);
    });

    var sectionTitle = sec.querySelector('.section-title');
    if (sectionTitle && sectionTitle.nextSibling) {
      sec.insertBefore(orbit, sectionTitle.nextSibling);
    } else {
      sec.appendChild(orbit);
    }

    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      orbit.querySelectorAll('.tool-pill').forEach(function (p) { p.classList.add('fly-in'); });
      io.unobserve(orbit);
    }, { threshold: 0.15 });
    io.observe(orbit);
  }

  // ── 7. ICONS ORBIT (#sourcesOrbit — circular layout fly-in) ──
  function initSourcesOrbit() {
    var el = document.getElementById('sourcesOrbit');
    if (!el) return;
    var obs = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      el.querySelectorAll('.src-icon').forEach(function (ic) {
        var delay = parseInt(ic.dataset.delay) || 0;
        setTimeout(function () { ic.classList.add('flown'); }, delay);
      });
      obs.unobserve(el);
    }, { threshold: 0.3 });
    obs.observe(el);
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
