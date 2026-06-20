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

  // ── 1. PARTICLE FIELD (Three.js infinite cloud + grid-collapse — v11 port) ─
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

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 2));

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    var CAM_START = 55;
    var CAM_END = -260;
    var CAM_SLOW = 0.45;
    var CLOUD_DEPTH = 320;

    camera.position.z = CAM_START;

    function resize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    var COUNT = isMobile ? 3000 : 16000;
    var SPREAD = 90;
    var GRID_N = 22, GRID_STEP = 9, GRID_COUNT = GRID_N * GRID_N * GRID_N;
    var CAM_HALF = CLOUD_DEPTH * 0.5;

    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(COUNT * 3);
    var gridTargets = new Float32Array(COUNT * 3);
    var isGridArr = new Float32Array(COUNT);
    var baseColors = new Float32Array(COUNT * 3);
    var sizes = new Float32Array(COUNT);

    var c1 = new THREE.Color('#D4B886'), c2 = new THREE.Color('#4a8c6a'), c3 = new THREE.Color('#F4EFE5');

    var gHalf = (GRID_N - 1) * GRID_STEP / 2;
    function nearestGridXY(px, py) {
      var gi2 = Math.max(0, Math.min(GRID_N - 1, Math.round((px + gHalf) / GRID_STEP)));
      var gj2 = Math.max(0, Math.min(GRID_N - 1, Math.round((py + gHalf) / GRID_STEP)));
      return [gi2 * GRID_STEP - gHalf, gj2 * GRID_STEP - gHalf];
    }

    for (var i = 0; i < COUNT; i++) {
      var x = (Math.random() - 0.5) * SPREAD, y = (Math.random() - 0.5) * SPREAD;
      var z = CAM_START - CLOUD_DEPTH * 0.5 + Math.random() * CLOUD_DEPTH;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      var t = Math.random();
      var col = t < 0.1 ? c1 : t < 0.25 ? c3 : c2;
      baseColors[i * 3] = col.r;
      baseColors[i * 3 + 1] = col.g;
      baseColors[i * 3 + 2] = col.b;
      sizes[i] = Math.random() * 1.2 + 0.3;

      if (i < GRID_COUNT) {
        isGridArr[i] = 1;
        var gxy = nearestGridXY(x, y);
        var gk = i % GRID_N;
        gridTargets[i * 3] = gxy[0];
        gridTargets[i * 3 + 1] = gxy[1];
        gridTargets[i * 3 + 2] = gk * GRID_STEP - gHalf;
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(baseColors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('gridTarget', new THREE.BufferAttribute(gridTargets, 3));
    geo.setAttribute('isGrid', new THREE.BufferAttribute(isGridArr, 1));

    var cGrid = new THREE.Color('#D4B886');

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uClock: { value: 0 },
        uFrozenClock: { value: 0 },
        uDz: { value: 0 },
        uFrozenDz: { value: 0 },
        uCamZ: { value: CAM_START },
        uFrozenCamZ: { value: CAM_START },
        uG: { value: 0 },
        uColorGrid: { value: new THREE.Vector3(cGrid.r, cGrid.g, cGrid.b) },
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: [
        'attribute float size; attribute vec3 gridTarget; attribute float isGrid;',
        'uniform float uClock, uFrozenClock, uDz, uFrozenDz, uCamZ, uFrozenCamZ, uG;',
        'uniform vec3 uColorGrid;',
        'varying vec3 vColor; varying float vViewZ;',
        'const float CAM_START = ' + CAM_START.toFixed(1) + ';',
        'const float CAM_SLOW = ' + CAM_SLOW.toFixed(3) + ';',
        'const float CLOUD_DEPTH = ' + CLOUD_DEPTH.toFixed(1) + ';',
        'const float CAM_HALF = ' + CAM_HALF.toFixed(1) + ';',
        'const float GRID_STEP = ' + GRID_STEP.toFixed(1) + ';',
        'float gmod(float x, float y) { return x - y * floor(x / y); }',
        'vec2 grad2(float ix, float iy) {',
        '  float h = fract(sin(ix * 127.1 + iy * 311.7) * 43758.5453);',
        '  float a = h * 6.2831853;',
        '  return vec2(cos(a), sin(a));',
        '}',
        'float noise(float x, float y) {',
        '  float F2 = 0.5 * (sqrt(3.0) - 1.0), G2 = (3.0 - sqrt(3.0)) / 6.0;',
        '  float s = (x + y) * F2, i = floor(x + s), j = floor(y + s);',
        '  float t = (i + j) * G2, x0 = x - (i - t), y0 = y - (j - t);',
        '  float i1 = x0 > y0 ? 1.0 : 0.0, j1 = x0 > y0 ? 0.0 : 1.0;',
        '  float x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1.0 + 2.0 * G2, y2 = y0 - 1.0 + 2.0 * G2;',
        '  float t0 = 0.5 - x0 * x0 - y0 * y0, n0 = t0 < 0.0 ? 0.0 : pow(t0, 4.0) * dot(grad2(i, j), vec2(x0, y0));',
        '  float t1 = 0.5 - x1 * x1 - y1 * y1, n1 = t1 < 0.0 ? 0.0 : pow(t1, 4.0) * dot(grad2(i + i1, j + j1), vec2(x1, y1));',
        '  float t2 = 0.5 - x2 * x2 - y2 * y2, n2 = t2 < 0.0 ? 0.0 : pow(t2, 4.0) * dot(grad2(i + 1.0, j + 1.0), vec2(x2, y2));',
        '  return 70.0 * (n0 + n1 + n2);',
        '}',
        'vec3 wander(vec3 base, float clock_, float dz, float camZ) {',
        '  float n = noise(base.x * 0.012 + clock_, base.y * 0.012 + clock_ * 0.7) * 4.0;',
        '  float shifted = base.z + dz * CAM_SLOW;',
        '  float wrapped = gmod(shifted - camZ + CAM_HALF, CLOUD_DEPTH) - CAM_HALF;',
        '  float cloudZ = camZ + wrapped;',
        '  return vec3(base.x + n * 0.6, base.y + n * 0.4, cloudZ + n * 0.3);',
        '}',
        'void main() {',
        '  vec3 live = wander(position, uClock, uDz, uCamZ);',
        '  vec3 finalPos = live;',
        '  float gridMix = 0.0;',
        '  if (isGrid > 0.5) {',
        '    if (uG > 0.0001) {',
        '      vec3 frozen = wander(position, uFrozenClock, uFrozenDz, uFrozenCamZ);',
        '      vec3 gridPos = vec3(gridTarget.x, gridTarget.y, live.z);',
        '      if (uG >= 0.9999) {',
        '        float snapX = floor(position.x / GRID_STEP + 0.5) * GRID_STEP;',
        '        float snapY = floor(position.y / GRID_STEP + 0.5) * GRID_STEP;',
        '        finalPos = vec3(snapX, snapY, live.z);',
        '      } else {',
        '        finalPos = mix(frozen, gridPos, uG);',
        '      }',
        '      gridMix = uG;',
        '    }',
        '  }',
        '  vColor = mix(color, uColorGrid, gridMix);',
        '  vec4 mv = modelViewMatrix * vec4(finalPos, 1.0);',
        '  vViewZ = -mv.z;',
        '  gl_PointSize = vViewZ > 0.5 ? min(size * (300.0 / vViewZ), 30.0) : 0.0;',
        '  gl_Position = projectionMatrix * mv;',
        '}',
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vColor; varying float vViewZ;',
        'void main() {',
        '  float d = length(gl_PointCoord - 0.5);',
        '  if (d > 0.5) discard;',
        '  float a = 1.0 - smoothstep(0.2, 0.5, d);',
        '  float nf = smoothstep(1.0, 8.0, vViewZ);',
        '  gl_FragColor = vec4(vColor, a * 0.85 * nf);',
        '}',
      ].join('\n'),
    });
    mat.vertexColors = true;

    var points = new THREE.Points(geo, mat);
    scene.add(points);

    var startY = 0, endY = 0, sectionsReady = false;
    function cacheSections() {
      var s = document.getElementById('obstacles'), e = document.getElementById('products');
      if (s && e) { startY = s.offsetTop; endY = e.offsetTop; sectionsReady = true; }
    }
    window.addEventListener('load', cacheSections);
    setTimeout(cacheSections, 400);

    var mx = 0, my = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', function (e) {
      mx = (e.clientX / window.innerWidth - .5) * 2; my = (e.clientY / window.innerHeight - .5) * 2;
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      mx = (e.touches[0].clientX / window.innerWidth - .5) * 2; my = (e.touches[0].clientY / window.innerHeight - .5) * 2;
    }, { passive: true });
    var rawScroll = window.scrollY || 0;
    window.addEventListener('scroll', function () { rawScroll = window.scrollY; }, { passive: true });

    var clock = 0;
    var prevG = 0;
    var u = mat.uniforms;
    function tick() {
      requestAnimationFrame(tick);
      clock += 0.0004;
      var totalH = Math.max(1, document.body.scrollHeight - window.innerHeight);
      var pct = Math.min(rawScroll / totalH, 1);

      var camZ = CAM_START + (CAM_END - CAM_START) * pct;
      camera.position.z = camZ;
      var dz = camZ - CAM_START;

      var g = sectionsReady
        ? Math.max(0, Math.min(1, (rawScroll - startY) / Math.max(1, endY - startY)))
        : 0;

      if (prevG <= 0 && g > 0) {
        u.uFrozenClock.value = clock;
        u.uFrozenDz.value = dz;
        u.uFrozenCamZ.value = camZ;
      }
      prevG = g;

      u.uClock.value = clock;
      u.uDz.value = dz;
      u.uCamZ.value = camZ;
      u.uG.value = g;

      tx += (mx - tx) * 0.04; ty += (my - ty) * 0.04;
      var pScale = Math.max(0.3, 1 - pct * 0.5);
      points.rotation.y = tx * 0.18 * pScale + clock * 0.06;
      points.rotation.x = -ty * 0.12 * pScale;

      renderer.render(scene, camera);
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
