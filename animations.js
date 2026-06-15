(function () {
  'use strict';

  // ── MOBILE DETECTION ─────────────────────────────────
  // На мобайлі Three.js не завантажується взагалі — лишається легка Aurora (CSS)
  const isMobile = window.matchMedia('(max-width: 768px)').matches
    || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // ── AURORA ──────────────────────────────────────────
  if (!document.getElementById('novellum-aurora')) {
    const aurora = document.createElement('div');
    aurora.id = 'novellum-aurora';
    aurora.innerHTML = `
      <div class="aurora-band ab1"></div>
      <div class="aurora-band ab2"></div>
      <div class="aurora-band ab3"></div>
    `;
    document.body.insertBefore(aurora, document.body.firstChild);
  }

  // ── MEASURE ZONES ───────────────────────────────────
  function measureZones() {
    const totalH = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const getTop = (id) => {
      const el = document.getElementById(id);
      return el ? el.offsetTop : null;
    };

    // Перша секція після hero і орієнтовні точки середини/кінця сторінки
    const heroBottom = getTop('for-whom') || getTop('value') || totalH * 0.15;
    const midPoint = getTop('process') || getTop('formats') || totalH * 0.50;
    const latePoint = getTop('demo') || getTop('contact') || totalH * 0.78;

    return {
      totalH,
      // Зона A: constellation — від початку до першої секції після hero
      zA_start: 0,
      zA_end: heroBottom * 0.8,

      // Зона B: helix — з'являється коли constellation майже зникла
      zB_start: heroBottom * 0.6,
      zB_end: midPoint,

      // Зона C: wave — нижня третина, не зникає до кінця
      zC_start: midPoint * 0.9,
      zC_end: latePoint,
    };
  }

  function iLerp(a, b, v) {
    if (a === b) return v >= a ? 1 : 0;
    return Math.min(1, Math.max(0, (v - a) / (b - a)));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(v, a, b) {
    return Math.min(Math.max(v, a), b);
  }

  function easeOut(x) {
    return 1 - (1 - x) * (1 - x);
  }

  // ── THREE.JS CANVAS ─────────────────────────────────
  // Завантажується тільки на desktop — на мобайлі економимо бандвідж і CPU
  if (!isMobile) {
    if (typeof THREE !== 'undefined') {
      initThreeBackground();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = initThreeBackground;
      document.head.appendChild(script);
    }
  }

  function initThreeBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'novellum-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;width:100vw;height:100vh;';
    document.body.insertBefore(canvas, document.body.children[1]);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(1);
    renderer.setSize(innerWidth, innerHeight);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 300);
    cam.position.set(0, 0, 13);
    cam.lookAt(0, 0, 0);

    let zones = measureZones();

    // ── MASTER GROUP (constellation) ──
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ── CONSTELLATION ──────────────────────────
    const NODE_N = 32;
    const nodeBase = [];
    const nodePhase = [];
    const nodePositions = new Float32Array(NODE_N * 3);
    for (let i = 0; i < NODE_N; i++) {
      const x = (Math.random() - 0.5) * 16;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 6 - 2;
      nodeBase.push(x, y, z);
      nodePhase.push(Math.random() * Math.PI * 2);
      nodePositions[i * 3] = x;
      nodePositions[i * 3 + 1] = y;
      nodePositions[i * 3 + 2] = z;
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: 0xD4B886, size: 0.07, transparent: true, opacity: 0.24,
      depthWrite: false, sizeAttenuation: true,
    });
    const constellationPoints = new THREE.Points(nodeGeo, nodeMat);

    // Lines between nearby nodes
    const linePositions = [];
    for (let i = 0; i < NODE_N; i++) {
      for (let j = i + 1; j < NODE_N; j++) {
        const dx = nodeBase[i * 3] - nodeBase[j * 3];
        const dy = nodeBase[i * 3 + 1] - nodeBase[j * 3 + 1];
        const dz = nodeBase[i * 3 + 2] - nodeBase[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 3.2) {
          linePositions.push(
            nodeBase[i * 3], nodeBase[i * 3 + 1], nodeBase[i * 3 + 2],
            nodeBase[j * 3], nodeBase[j * 3 + 1], nodeBase[j * 3 + 2]
          );
        }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xD4B886, transparent: true, opacity: 0.06 });
    const constellationLines = new THREE.LineSegments(lineGeo, lineMat);

    const constellationGroup = new THREE.Group();
    constellationGroup.add(constellationPoints);
    constellationGroup.add(constellationLines);
    masterGroup.add(constellationGroup);

    // ── WAVE PARTICLES ─────────────────────────
    const GW = 36;
    const GH = GW;
    const SPACING = 0.38;
    const waveCount = GW * GH;
    const wavePositions = new Float32Array(waveCount * 3);
    let wi = 0;
    for (let ix = 0; ix < GW; ix++) {
      for (let iz = 0; iz < GH; iz++) {
        wavePositions[wi * 3] = (ix - GW / 2) * SPACING;
        wavePositions[wi * 3 + 1] = 0;
        wavePositions[wi * 3 + 2] = (iz - GH / 2) * SPACING - 4;
        wi++;
      }
    }
    const waveGeo = new THREE.BufferGeometry();
    waveGeo.setAttribute('position', new THREE.BufferAttribute(wavePositions, 3));
    const waveMat = new THREE.PointsMaterial({
      color: 0xD4B886, size: 0.03, transparent: true, opacity: 0,
      depthWrite: false, sizeAttenuation: true,
    });
    const wavePoints = new THREE.Points(waveGeo, waveMat);
    wavePoints.position.y = -12; // починається нижче екрану, піднімається при скролі
    scene.add(wavePoints);

    // ── ANIMATION LOOP ─────────────────────────
    let t = 0;
    let mx = 0, my = 0;
    window.addEventListener('mousemove', e => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    // Smoothed (lerp'd) state — усуває стрибки при швидкому скролі
    let bgScrollSmooth = 0;
    let smConstOp = 0, smWaveOp = 0;
    let smMasterY = 0;
    let smWaveY = -12;

    function tick() {
      t += 0.0025;

      bgScrollSmooth = lerp(bgScrollSmooth, window.scrollY * 0.35, 0.06);
      const bgY = bgScrollSmooth;

      // Scroll-based parallax for masterGroup (рухається вгору разом зі скролом)
      const targetMasterY = -(bgY * 0.001 * -4);
      smMasterY = lerp(smMasterY, targetMasterY, 0.04);
      masterGroup.position.y = smMasterY;
      masterGroup.rotation.y = mx * 0.05;
      masterGroup.rotation.x = my * 0.03;

      // Organic drift of constellation
      constellationGroup.position.y = Math.sin(t * 0.2) * 0.05;
      constellationGroup.rotation.y = Math.sin(t * 0.15) * 0.02;

      // Wave undulation — більш виразна амплітуда
      const posAttr = waveGeo.attributes.position;
      for (let ix = 0; ix < GW; ix++) {
        for (let iz = 0; iz < GH; iz++) {
          const idx = ix * GH + iz;
          const x = wavePositions[idx * 3];
          const z = wavePositions[idx * 3 + 2];
          posAttr.array[idx * 3 + 1] =
            Math.sin(x * 0.35 + t * 6) * 0.38 +
            Math.sin(z * 0.35 * 0.58 + t * 4 * 0.48) * 0.24 +
            Math.cos((x + z) * 0.4 + t * 0.28) * 0.13;
        }
      }
      posAttr.needsUpdate = true;

      // Фази opacity / положення, рівномірно розподілені по всій сторінці
      const constIn = iLerp(zones.zA_start, zones.zA_end * 0.5, bgY);
      const constOut = iLerp(zones.zB_start, zones.zB_end * 0.4, bgY);
      const constOpTarget = clamp(constIn, 0, 1) * clamp(1 - constOut, 0, 1);

      const waveIn = iLerp(zones.zC_start, zones.zC_end * 0.8, bgY);
      const waveOpTarget = clamp(waveIn * 1.2, 0, 1);

      smConstOp = lerp(smConstOp, constOpTarget, 0.04);
      smWaveOp = lerp(smWaveOp, waveOpTarget, 0.04);

      nodeMat.opacity = 0.24 * smConstOp;
      lineMat.opacity = 0.06 * smConstOp;

      waveMat.opacity = smWaveOp * 0.65;

      // Хвилі піднімаються знизу
      const waveTargetY = lerp(-12, -2.5, easeOut(waveIn));
      smWaveY = lerp(smWaveY, waveTargetY, 0.04);
      wavePoints.position.y = smWaveY;

      renderer.render(scene, cam);
      requestAnimationFrame(tick);
    }
    tick();

    window.addEventListener('resize', () => {
      cam.aspect = innerWidth / innerHeight;
      cam.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      zones = measureZones();
    });
  }

  // ── DASHBOARD ANIMATIONS ────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {

    // 1. Sparkline
    const sparkPath = document.querySelector('.hero path[stroke]');
    if (sparkPath) {
      const len = sparkPath.getTotalLength();
      sparkPath.style.strokeDasharray = len;
      sparkPath.style.strokeDashoffset = len;
      sparkPath.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1) 0.3s';
      setTimeout(() => { sparkPath.style.strokeDashoffset = 0; }, 100);
    }

    // 2. Progress bar "Виконання плану"
    const progFill = document.querySelector('.hero [style*="width"]');
    if (progFill) {
      const target = progFill.style.width || progFill.getAttribute('aria-valuenow') + '%';
      progFill.style.width = '0%';
      progFill.style.transition = 'width 1.4s cubic-bezier(.4,0,.2,1) 0.5s';
      setTimeout(() => { progFill.style.width = target; }, 200);
    }

    // 3. Scroll animations setup
    initScrollAnimations();
  });

  // ── SCROLL ANIMATIONS ───────────────────────────────
  function initScrollAnimations() {

    // Stagger reveal
    const staggerObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const parent = entry.target.closest('[data-anim="stagger-parent"]') || entry.target.parentElement;
        const siblings = [...parent.querySelectorAll('[data-anim="stagger"]')];
        siblings.forEach((el, i) => {
          setTimeout(() => el.classList.add('is-visible'), i * 120);
        });
        staggerObs.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    const staggerGroups = new Set();
    document.querySelectorAll('[data-anim="stagger"]').forEach(el => {
      const parent = el.closest('[data-anim="stagger-parent"]') || el.parentElement;
      if (!staggerGroups.has(parent)) {
        staggerGroups.add(parent);
        staggerObs.observe(el);
      }
    });

    // Counter animation
    function easeOutQ(t) { return 1 - Math.pow(1 - t, 4); }
    function animCounter(el, target) {
      const unit = el.dataset.unit || '';
      const start = performance.now();
      (function f(now) {
        const t = Math.min((now - start) / 1300, 1);
        el.textContent = Math.round(easeOutQ(t) * target) + unit;
        if (t < 1) requestAnimationFrame(f);
      })(performance.now());
    }

    document.querySelectorAll('[data-anim="counter"]').forEach(el => {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          if (el.dataset.done) return;
          el.dataset.done = '1';
          animCounter(el, +el.dataset.target);
          io.unobserve(el);
        });
      }, { threshold: 0.5 });
      io.observe(el);
    });

    // Timeline секція #process
    const timeline = document.querySelector('#process');
    if (timeline) {
      const tlObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const line = timeline.querySelector('[data-anim="timeline-line"]');
          if (line) line.classList.add('is-visible');
          const dots = timeline.querySelectorAll('[data-anim="timeline-dot"]');
          dots.forEach((dot, i) => setTimeout(() => dot.classList.add('is-visible'), 300 + i * 220));
          tlObs.unobserve(e.target);
        });
      }, { threshold: 0.2 });
      tlObs.observe(timeline);
    }
  }

})();
