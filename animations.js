(function () {
  'use strict';

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
    const ids = ['value', 'obstacles', 'formats', 'process', 'demo', 'pricing', 'contact'];
    const tops = ids.map(id => {
      const el = document.getElementById(id);
      return el ? el.offsetTop : null;
    }).filter(v => v !== null).sort((a, b) => a - b);

    return {
      totalH,
      zA: tops[1] || totalH * 0.33,  // після 2-ї секції
      zB: tops[3] || totalH * 0.66,  // після 4-ї секції
    };
  }

  function iLerp(a, b, v) {
    if (a === b) return v >= a ? 1 : 0;
    return Math.min(1, Math.max(0, (v - a) / (b - a)));
  }

  // ── THREE.JS CANVAS ─────────────────────────────────
  if (typeof THREE !== 'undefined') {
    initThreeBackground();
  }

  function initThreeBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'novellum-canvas';
    canvas.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;width:100vw;height:100vh;';
    document.body.insertBefore(canvas, document.body.children[1]);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 300);
    cam.position.set(0, 0, 13);
    cam.lookAt(0, 0, 0);

    let zones = measureZones();
    const isMobile = () => innerWidth <= 768;

    // ── MASTER GROUP (constellation + helix) ──
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ── CONSTELLATION ──────────────────────────
    const NODE_N = isMobile() ? 24 : 48;
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

    // ── DATA HELIX x2 ──────────────────────────
    const HELIX_LABELS = ['847', '34.2%', '+12.4', '₴1.28M', 'KPI', '76%',
      '11', 'EBITDA', 'ROI', 'LTV', 'ARR', 'MTD', 'YoY', 'Q4', 'NDA',
      '→', '∑', 'Δ', '87%', '99.1%'];

    function makeLabelSprite(text) {
      const cnv = document.createElement('canvas');
      cnv.width = 128; cnv.height = 64;
      const ctx = cnv.getContext('2d');
      ctx.font = '600 30px Manrope, sans-serif';
      ctx.fillStyle = 'rgba(212,184,134,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 34);
      const tex = new THREE.CanvasTexture(cnv);
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(1.6, 0.8, 1);
      return sprite;
    }

    function buildHelix(xOffset, sign) {
      const group = new THREE.Group();
      group.position.x = xOffset;
      HELIX_LABELS.forEach((label, i) => {
        const turns = 2;
        const angle = (i / HELIX_LABELS.length) * Math.PI * 2 * turns;
        const radius = 1.3;
        const sprite = makeLabelSprite(label);
        sprite.position.set(
          Math.cos(angle) * radius * sign,
          (i - HELIX_LABELS.length / 2) * 0.45,
          Math.sin(angle) * radius
        );
        group.add(sprite);
      });
      return group;
    }

    const helixLeft = buildHelix(-5.5, 1);
    const helixRight = buildHelix(5.5, -1);
    masterGroup.add(helixLeft);
    masterGroup.add(helixRight);

    // ── WAVE PARTICLES ─────────────────────────
    const GW = isMobile() ? 48 : 72;
    const GH = GW;
    const SPACING = 0.22;
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
    wavePoints.position.y = -10;
    scene.add(wavePoints);

    // ── ANIMATION LOOP ─────────────────────────
    let t = 0;
    let mx = 0, my = 0;
    window.addEventListener('mousemove', e => {
      mx = (e.clientX / innerWidth - 0.5) * 2;
      my = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    function tick() {
      t += 0.0025;
      const bgY = window.scrollY * 0.35;

      // Scroll-based parallax for masterGroup
      masterGroup.position.y = bgY * 0.001 * -4;
      masterGroup.rotation.y = mx * 0.05;
      masterGroup.rotation.x = my * 0.03;

      // Organic drift of constellation
      constellationGroup.position.y = Math.sin(t * 0.2) * 0.05;
      constellationGroup.rotation.y = Math.sin(t * 0.15) * 0.02;

      // Helix rotation
      helixLeft.rotation.y += 0.001;
      helixRight.rotation.y -= 0.001;

      // Wave undulation
      const posAttr = waveGeo.attributes.position;
      for (let ix = 0; ix < GW; ix++) {
        for (let iz = 0; iz < GH; iz++) {
          const idx = ix * GH + iz;
          posAttr.array[idx * 3 + 1] = Math.sin(ix * 0.35 + t * 6) * 0.18 + Math.cos(iz * 0.35 + t * 4) * 0.18;
        }
      }
      posAttr.needsUpdate = true;
      wavePoints.position.y = -10 + iLerp(0, 1, 1) * 7.2; // base lift, opacity drives visibility

      // Opacity phases tied to zones
      const cIn = iLerp(0, zones.zA * 0.2, bgY);
      const cOut = iLerp(zones.zA * 0.7, zones.zA, bgY);
      const constellationOpacity = cIn * (1 - cOut);
      nodeMat.opacity = 0.24 * constellationOpacity;
      lineMat.opacity = 0.06 * constellationOpacity;

      const hIn = iLerp(zones.zA * 0.8, zones.zB * 0.5, bgY);
      const hOut = iLerp(zones.zB * 0.8, zones.zB, bgY);
      const helixOpacity = hIn * (1 - hOut);
      helixLeft.children.forEach(s => s.material.opacity = 0.7 * helixOpacity);
      helixRight.children.forEach(s => s.material.opacity = 0.7 * helixOpacity);

      const wIn = iLerp(zones.zB * 0.9, zones.zB * 1.3, bgY);
      waveMat.opacity = 0.42 * wIn;
      wavePoints.position.y = -10 + 7.2 * wIn;

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
