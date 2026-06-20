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
    initDemoFrameScale();
    initCalcHintAlign();
  });

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
      var hintTop = hint.getBoundingClientRect().top;
      var btnBottom = btn.getBoundingClientRect().bottom;
      var hintHeight = hint.getBoundingClientRect().height;
      var targetTop = btnBottom - hintHeight;
      var delta = targetTop - hintTop;
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

  // ── 1. PARTICLE FIELD (Three.js infinite cloud + connected constellation) ─
  function initParticleField() {
    if (typeof THREE === 'undefined') return;

    var heroEl = document.querySelector('.hero');
    var canvas = document.createElement('canvas');
    canvas.id = 'novellum-canvas';
    if (heroEl && heroEl.parentNode) {
      heroEl.parentNode.insertBefore(canvas, heroEl.nextSibling);
    } else {
      document.body.prepend(canvas);
    }

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, .1, 300);

    var CLOUD_DEPTH = 200;
    var SPREAD = 130;
    var CAM_START = 80, CAM_END = 20;

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // ── dense cloud layer (no connections, gives depth/atmosphere) ──
    var CLOUD_N = isMobile ? 1800 : 4500;
    var cloudGeo = new THREE.BufferGeometry();
    var cloudPos = new Float32Array(CLOUD_N * 3);
    for (var i = 0; i < CLOUD_N; i++) {
      cloudPos[i * 3] = (Math.random() - .5) * SPREAD;
      cloudPos[i * 3 + 1] = (Math.random() - .5) * SPREAD;
      cloudPos[i * 3 + 2] = Math.random() * CLOUD_DEPTH - CAM_START;
    }
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPos, 3));
    var cloudMat = new THREE.PointsMaterial({
      color: 0xd4b886,
      size: isMobile ? 0.55 : 0.65,
      transparent: true,
      opacity: .35,
      sizeAttenuation: true,
      depthWrite: false,
    });
    var cloud = new THREE.Points(cloudGeo, cloudMat);
    scene.add(cloud);

    // ── sparse constellation layer (connected by lines, near camera) ──
    var N = isMobile ? 80 : 180;
    var CONNECT_DIST = isMobile ? 9 : 12;
    var STAGE_DEPTH = 40;
    var nodes = [];
    var nodeGeo = new THREE.BufferGeometry();
    var nodePos = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) {
      var node = {
        x: (Math.random() - .5) * 60,
        y: (Math.random() - .5) * 40,
        z: Math.random() * STAGE_DEPTH,
        vx: (Math.random() - .5) * .02,
        vy: (Math.random() - .5) * .02,
      };
      nodes.push(node);
      nodePos[i * 3] = node.x;
      nodePos[i * 3 + 1] = node.y;
      nodePos[i * 3 + 2] = node.z - CAM_START;
    }
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    var nodeMat = new THREE.PointsMaterial({
      color: 0xd4b886,
      size: isMobile ? 1.1 : 1.3,
      transparent: true,
      opacity: .65,
      sizeAttenuation: true,
      depthWrite: false,
    });
    var nodePoints = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodePoints);

    var maxLineSegs = N * 6;
    var linePos = new Float32Array(maxLineSegs * 2 * 3);
    var lineAlpha = new Float32Array(maxLineSegs * 2);
    var lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
    lineGeo.setAttribute('alpha', new THREE.BufferAttribute(lineAlpha, 1));
    var lineMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { color: { value: new THREE.Color(0xd4b886) } },
      vertexShader: 'attribute float alpha; varying float vAlpha; void main(){ vAlpha = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 color; varying float vAlpha; void main(){ gl_FragColor = vec4(color, vAlpha); }',
    });
    var lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── scroll-driven camera dolly across the whole page ──
    var camZ = CAM_START;
    function scrollProgress() {
      var doc = document.documentElement;
      var max = (doc.scrollHeight - window.innerHeight) || 1;
      return Math.max(0, Math.min(1, window.scrollY / max));
    }

    function tick() {
      var p = scrollProgress();
      camZ = CAM_START + (CAM_END - CAM_START) * p;
      camera.position.z = camZ;

      // recycle cloud particles that fall behind the camera back to the far end
      var posAttr = cloud.geometry.attributes.position.array;
      for (var i = 0; i < CLOUD_N; i++) {
        var idx = i * 3 + 2;
        if (posAttr[idx] > camZ - 1) posAttr[idx] -= CLOUD_DEPTH;
        if (posAttr[idx] < camZ - CLOUD_DEPTH - 1) posAttr[idx] += CLOUD_DEPTH;
      }
      cloud.geometry.attributes.position.needsUpdate = true;

      // drift + recycle constellation nodes, rebuild line segments
      var np = nodePoints.geometry.attributes.position.array;
      for (var i = 0; i < N; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < -30) n.x = 30; if (n.x > 30) n.x = -30;
        if (n.y < -20) n.y = 20; if (n.y > 20) n.y = -20;
        if (n.z < camZ - 1) n.z += STAGE_DEPTH;
        if (n.z > camZ + STAGE_DEPTH - 1) n.z -= STAGE_DEPTH;
        np[i * 3] = n.x;
        np[i * 3 + 1] = n.y;
        np[i * 3 + 2] = n.z - CAM_START;
      }
      nodePoints.geometry.attributes.position.needsUpdate = true;

      var segCount = 0;
      for (var i = 0; i < N && segCount < maxLineSegs; i++) {
        for (var j = i + 1; j < N && segCount < maxLineSegs; j++) {
          var a = nodes[i], b = nodes[j];
          var dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
          var d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < CONNECT_DIST) {
            var base = segCount * 2 * 3;
            linePos[base] = a.x; linePos[base + 1] = a.y; linePos[base + 2] = a.z - CAM_START;
            linePos[base + 3] = b.x; linePos[base + 4] = b.y; linePos[base + 5] = b.z - CAM_START;
            var al = 0.5 * (1 - d / CONNECT_DIST);
            lineAlpha[segCount * 2] = al;
            lineAlpha[segCount * 2 + 1] = al;
            segCount++;
          }
        }
      }
      for (var k = segCount; k < maxLineSegs; k++) {
        lineAlpha[k * 2] = 0;
        lineAlpha[k * 2 + 1] = 0;
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.alpha.needsUpdate = true;
      lineGeo.setDrawRange(0, segCount * 2);

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
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

    if (isMobile) return;
    var maxShift = 10;
    var targetX = 0, targetY = 0, curX = 0, curY = 0;
    window.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;
      var ratioX = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width / 2)));
      var ratioY = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height / 2)));
      targetX = ratioX * maxShift;
      targetY = ratioY * maxShift;
    }, { passive: true });

    function tick() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      el.style.setProperty('--px', curX.toFixed(2) + 'px');
      el.style.setProperty('--py', curY.toFixed(2) + 'px');
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
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
