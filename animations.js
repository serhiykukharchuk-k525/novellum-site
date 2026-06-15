(function () {
  'use strict';

  // ── DASHBOARD ANIMATIONS ────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {

    // 0. Header shadow on scroll
    const headerEl = document.querySelector('body > header');
    if (headerEl) {
      window.addEventListener('scroll', () => {
        headerEl.classList.toggle('scrolled', window.scrollY > 50);
      }, { passive: true });
    }

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
