(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 768;

  window.addEventListener('DOMContentLoaded', function () {
    if (!prefersReduced && !isMobile) initParticleField();
    if (!prefersReduced) {
      initCircleStats();
      initProcessWave();
      initTimelineEnhancements();
      initPhoneMockup();
      initTypewriter();
      initFlyingIcons();
    }
  });

  // ── 1. PARTICLE FIELD ────────────────────────────────────────
  function initParticleField() {
    var canvas = document.createElement('canvas');
    canvas.id = 'novellum-canvas';
    document.body.prepend(canvas);
    var ctx = canvas.getContext('2d');
    var W, H;
    var N = 180;
    var particles = [];

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    for (var i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - .5) * .22,
        vy: (Math.random() - .5) * .22,
      });
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < N; i++) {
        var p = particles[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,184,134,.18)';
        ctx.fill();
        for (var j = i + 1; j < N; j++) {
          var q = particles[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < 65) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = 'rgba(212,184,134,' + (0.035 * (1 - d / 65)).toFixed(3) + ')';
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ── 2. CIRCLE STATS ──────────────────────────────────────────
  function initCircleStats() {
    var items = document.querySelectorAll('.hero-trust-item');
    var R = 21;
    var C = 2 * Math.PI * R;

    items.forEach(function (item) {
      var spans = item.querySelectorAll('span');
      if (spans.length < 2) return;
      var valSpan = spans[1];
      var text = valSpan.textContent.trim();
      var m = text.match(/(\d+)/);
      if (!m) return;

      var num = parseInt(m[1], 10);
      var max = num <= 7 ? 10 : num <= 20 ? 30 : 100;
      var ratio = Math.min(num / max, 0.88);
      var dashLen = C * ratio;

      var wrap = document.createElement('div');
      wrap.className = 'trust-circle-wrap';
      wrap.innerHTML =
        '<svg viewBox="0 0 52 52" width="52" height="52" aria-hidden="true">' +
          '<circle class="trust-track" cx="26" cy="26" r="' + R + '" stroke-width="1.5"/>' +
          '<circle class="trust-arc" cx="26" cy="26" r="' + R + '" stroke-width="1.5"' +
            ' stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + C.toFixed(2) + '"/>' +
        '</svg>' +
        '<span class="trust-num">' + text + '</span>';

      valSpan.replaceWith(wrap);

      var arc = wrap.querySelector('.trust-arc');
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        arc.style.strokeDashoffset = (C - dashLen).toFixed(2);
        io.unobserve(item);
      }, { threshold: 0.5 });
      io.observe(item);
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

  // ── 5. PHONE MOCKUP (#demo) ──────────────────────────────────
  function initPhoneMockup() {
    var container = document.querySelector('#demo .container');
    if (!container) return;
    var sectionTitle = container.querySelector('.section-title');
    if (!sectionTitle) return;
    var descP = sectionTitle.nextElementSibling;
    if (!descP) return;

    var intro = document.createElement('div');
    intro.className = 'demo-intro';
    var textWrap = document.createElement('div');
    textWrap.className = 'demo-text';

    // Open-demo button
    var openBtn = document.createElement('a');
    openBtn.className = 'btn-demo-open';
    openBtn.href = '#';
    openBtn.textContent = '▶ Відкрити демо';
    openBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var iframeDiv = document.querySelector('#demo [loading="lazy"]');
      if (iframeDiv) iframeDiv.closest('div').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Restructure DOM
    container.insertBefore(intro, descP);
    textWrap.appendChild(descP);
    textWrap.appendChild(openBtn);
    intro.appendChild(textWrap);

    // Build phone
    var phone = document.createElement('div');
    phone.className = 'phone-frame';
    phone.setAttribute('aria-hidden', 'true');
    phone.innerHTML =
      '<div class="phone-notch"></div>' +
      '<div class="phone-screen">' +
        '<div class="ph-label">Executive overview · МТД</div>' +
        '<div class="ph-val">₴1 284K</div>' +
        '<div class="ph-delta">+12.4%</div>' +
        '<div class="ph-label" style="margin-top:10px">Виконання плану</div>' +
        '<div class="ph-bar-track"><div class="ph-bar-fill"></div></div>' +
        '<div style="font-size:7px;color:rgba(244,239,229,.22);text-align:right;margin-bottom:8px">76%</div>' +
        '<div class="ph-metrics">' +
          '<div class="ph-metric">' +
            '<div class="ph-label">Маржа</div>' +
            '<div class="ph-metric-val">34.2%</div>' +
            '<div class="ph-metric-sub">+1.2pp</div>' +
          '</div>' +
          '<div class="ph-metric">' +
            '<div class="ph-label">Зам/день</div>' +
            '<div class="ph-metric-val">847</div>' +
            '<div class="ph-metric-sub" style="color:#e05c50">−3.1%</div>' +
          '</div>' +
        '</div>' +
        '<div class="ph-focus">' +
          '<div class="ph-label" style="margin-bottom:5px">Фокус тижня</div>' +
          '<div class="ph-focus-item">Маржа A впала на 2.1pp</div>' +
          '<div class="ph-focus-item">Логістика: 2 постачальника</div>' +
          '<div class="ph-focus-item">KPI закриття: 87%</div>' +
        '</div>' +
        '<div class="ph-footer">Nóvellum Analytics · Power BI</div>' +
      '</div>';

    intro.appendChild(phone);

    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      phone.classList.add('is-visible');
      io.unobserve(phone);
    }, { threshold: 0.15 });
    io.observe(phone);
  }

  // ── 6. TYPEWRITER (#value section) ───────────────────────────
  function initTypewriter() {
    var valueSection = document.querySelector('#value .section-title > div');
    if (!valueSection) return;
    var h2 = valueSection.querySelector('h2');
    if (!h2) return;

    var wrap = document.createElement('div');
    wrap.className = 'section-tw-wrap';
    var tw = document.createElement('span');
    tw.className = 'section-tw-line';
    tw.textContent = 'Power BI · E-commerce · Retail';
    var cur = document.createElement('span');
    cur.className = 'tw-cursor2';
    cur.setAttribute('aria-hidden', 'true');
    wrap.appendChild(tw); wrap.appendChild(cur);
    h2.after(wrap);

    var words = ['Power BI · E-commerce · Retail', 'Google Sheets · PostgreSQL · 1С', 'Будь-яке джерело даних'];
    var idx = 0;
    setInterval(function () {
      idx = (idx + 1) % words.length;
      tw.style.opacity = '0';
      setTimeout(function () { tw.textContent = words[idx]; tw.style.opacity = '1'; }, 220);
    }, 2800);
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

})();
