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

      var group = new THREE.Group();
      scene.add(group);

      var curveCount = isMobile ? 2 : 4;
      var pointsPerCurve = isMobile ? 220 : 480;
      var spread = isMobile ? 38 : 70;

      function buildCurve() {
        var pts = [];
        var segments = 5;
        for (var i = 0; i <= segments; i++) {
          pts.push(new THREE.Vector3(
            (Math.random() - .5) * spread * 2,
            (i / segments - .5) * spread * 2.2,
            (Math.random() - .5) * 40
          ));
        }
        return new THREE.CatmullRomCurve3(pts);
      }

      var layers = [];
      for (var c = 0; c < curveCount; c++) {
        var curve = buildCurve();
        var samples = curve.getSpacedPoints(pointsPerCurve);
        var positions = new Float32Array(samples.length * 3);
        for (var i = 0; i < samples.length; i++) {
          positions[i * 3] = samples[i].x + (Math.random() - .5) * 1.4;
          positions[i * 3 + 1] = samples[i].y + (Math.random() - .5) * 1.4;
          positions[i * 3 + 2] = samples[i].z + (Math.random() - .5) * 1.4;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        var isGold = c % 2 === 0;
        var mat = new THREE.PointsMaterial({
          size: isGold ? 0.55 : 0.32,
          map: sprite,
          color: isGold ? 0xD4B886 : 0xF4EFE5,
          transparent: true,
          opacity: isGold ? 0.85 : 0.35,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          sizeAttenuation: true,
        });

        var points = new THREE.Points(geo, mat);
        points.userData.speed = 0.04 + Math.random() * 0.06;
        points.userData.offset = Math.random() * Math.PI * 2;
        group.add(points);
        layers.push(points);
      }

      var mouseX = 0, mouseY = 0;
      window.addEventListener('mousemove', function (e) {
        mouseX = (e.clientX / W - .5);
        mouseY = (e.clientY / H - .5);
      }, { passive: true });

      function tick() {
        var t = performance.now() / 1000;
        group.rotation.y = Math.sin(t * 0.04) * 0.18;
        group.rotation.x = Math.cos(t * 0.03) * 0.06;
        layers.forEach(function (p) {
          p.position.y = ((t * p.userData.speed * 30 + p.userData.offset * 10) % (spread * 2.2)) - spread * 1.1;
        });
        camera.position.x += (mouseX * 14 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 10 - camera.position.y) * 0.02;
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
