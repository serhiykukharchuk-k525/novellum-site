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

  // ── 1. PARTICLE FIELD (DNA Capital style — fixed full-viewport WebGL bg) ─
  // Loaded as a dynamic ES module import so the rest of animations.js can
  // stay a plain script; Three.js itself is fetched from a CDN at runtime.
  function initParticleField() {
    var canvas = document.createElement('canvas');
    canvas.id = 'novellum-canvas';
    var heroEl = document.querySelector('.hero');
    if (heroEl && heroEl.parentNode) {
      heroEl.parentNode.insertBefore(canvas, heroEl.nextSibling);
    } else {
      document.body.prepend(canvas);
    }

    import('https://unpkg.com/three@0.160.1/build/three.module.js').then(function (THREE) {
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 60;

      var W, H;
      function resize() {
        W = window.innerWidth; H = window.innerHeight;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.6));
        renderer.setSize(W, H);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });

      // soft round glow sprite, reused by every particle layer
      var spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = spriteCanvas.height = 64;
      var sctx = spriteCanvas.getContext('2d');
      var grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,.5)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 64, 64);
      var sprite = new THREE.CanvasTexture(spriteCanvas);

      // ── sparse starfield (faint, scattered, near-static) ──
      var starCount = isMobile ? 160 : 420;
      var starPositions = new Float32Array(starCount * 3);
      var starColors = new Float32Array(starCount * 3);
      var goldC = new THREE.Color(0xD4B886);
      var creamC = new THREE.Color(0xF4EFE5);
      for (var s = 0; s < starCount; s++) {
        starPositions[s * 3] = (Math.random() - .5) * 160;
        starPositions[s * 3 + 1] = (Math.random() - .5) * 140;
        starPositions[s * 3 + 2] = (Math.random() - .5) * 80 - 10;
        var sc = Math.random() < 0.5 ? goldC : creamC;
        var b = 0.3 + Math.random() * 0.5;
        starColors[s * 3] = sc.r * b;
        starColors[s * 3 + 1] = sc.g * b;
        starColors[s * 3 + 2] = sc.b * b;
      }
      var starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
      var starMat = new THREE.PointsMaterial({
        size: 0.5,
        map: sprite,
        vertexColors: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      var starField = new THREE.Points(starGeo, starMat);
      scene.add(starField);

      // ── twisted hourglass particle funnel (the DNA Capital centerpiece) ──
      var segU = isMobile ? 90 : 150;
      var segV = isMobile ? 26 : 56;
      var lengthScale = isMobile ? 34 : 52;
      var maxRadius = isMobile ? 11 : 19;
      var twistTurns = 1.15;

      var vertCount = (segU + 1) * segV;
      var tubePositions = new Float32Array(vertCount * 3);
      var tubeColors = new Float32Array(vertCount * 3);
      var idx = 0;
      for (var ui = 0; ui <= segU; ui++) {
        var u = ui / segU;          // 0..1 along the funnel's length
        var centered = u - 0.5;     // -0.5..0.5, 0 = pinch point
        var radius = maxRadius * Math.pow(Math.abs(centered) * 2, 1.4);
        var twistAngle = centered * twistTurns * Math.PI * 2;
        var brightness = 1 - Math.min(1, Math.abs(centered) * 2.1);
        for (var vi = 0; vi < segV; vi++) {
          var phi = (vi / segV) * Math.PI * 2;
          var jitter = (Math.random() - .5) * 0.6;
          var x = (radius + jitter) * Math.cos(phi + twistAngle);
          var z = (radius + jitter) * Math.sin(phi + twistAngle);
          var y = centered * lengthScale;
          tubePositions[idx * 3] = x;
          tubePositions[idx * 3 + 1] = y;
          tubePositions[idx * 3 + 2] = z;

          // bright cream core near the pinch, fading out to bronze/gold
          var mixed = creamC.clone().lerp(goldC, Math.min(1, Math.abs(centered) * 2.4));
          var bb = 0.25 + brightness * 0.9;
          tubeColors[idx * 3] = mixed.r * bb;
          tubeColors[idx * 3 + 1] = mixed.g * bb;
          tubeColors[idx * 3 + 2] = mixed.b * bb;
          idx++;
        }
      }
      var tubeGeo = new THREE.BufferGeometry();
      tubeGeo.setAttribute('position', new THREE.BufferAttribute(tubePositions, 3));
      tubeGeo.setAttribute('color', new THREE.BufferAttribute(tubeColors, 3));
      var tubeMat = new THREE.PointsMaterial({
        size: isMobile ? 0.42 : 0.5,
        map: sprite,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      var funnel = new THREE.Points(tubeGeo, tubeMat);
      funnel.rotation.z = Math.PI / 2.4;
      var funnelGroup = new THREE.Group();
      funnelGroup.add(funnel);
      funnelGroup.position.x = isMobile ? 0 : 14;
      scene.add(funnelGroup);

      var mouseX = 0, mouseY = 0;
      window.addEventListener('mousemove', function (e) {
        mouseX = (e.clientX / W - .5);
        mouseY = (e.clientY / H - .5);
      }, { passive: true });

      function tick() {
        var t = performance.now() / 1000;
        funnelGroup.rotation.y = t * 0.12;
        funnelGroup.rotation.x = Math.sin(t * 0.15) * 0.12;
        starField.rotation.y = t * 0.005;
        camera.position.x += (mouseX * 10 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 7 - camera.position.y) * 0.02;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }).catch(function () {
      // CDN unreachable / WebGL unsupported — leave the page background plain.
      canvas.remove();
    });
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
