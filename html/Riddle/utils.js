/* =========================================================
   utils.js
   Small, dependency-free helpers shared across the app.
   Everything here is attached to a single global: `Utils`.
   ========================================================= */

const Utils = (() => {

  /* ---------- DOM shorthand ---------- */

  function qs(selector, scope = document) {
    return scope.querySelector(selector);
  }

  function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
  }

  /**
   * Create an element with attributes/children in one call.
   * @param {string} tag
   * @param {object} opts { className, text, html, attrs: {}, children: [] }
   */
  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.className) node.className = opts.className;
    if (opts.text !== undefined) node.textContent = opts.text;
    if (opts.html !== undefined) node.innerHTML = opts.html;
    if (opts.attrs) {
      Object.entries(opts.attrs).forEach(([k, v]) => node.setAttribute(k, v));
    }
    if (opts.children) {
      opts.children.forEach((child) => child && node.appendChild(child));
    }
    return node;
  }

  /* ---------- timing ---------- */

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function prefersReducedMotion() {
    return window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function prefersFinePointer() {
    return window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  /**
   * Reveal `text` inside `node` one character at a time.
   * Resolves once finished (or immediately if the user has asked
   * for reduced motion, or if the reveal is skipped).
   * Clicking/tapping the node (or pressing Enter/Space) fast-forwards it.
   */
  function typewrite(node, text, speed = 22) {
    node.textContent = '';
    node.classList.remove('is-typing');
    if (prefersReducedMotion()) {
      node.textContent = text;
      return Promise.resolve();
    }

    node.classList.add('is-typing');

    return new Promise((resolve) => {
      let i = 0;
      let done = false;
      let timer = null;

      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        node.textContent = text;
        node.classList.remove('is-typing');
        node.removeEventListener('click', finish);
        resolve();
      };

      const tick = () => {
        if (done) return;
        i += 1;
        node.textContent = text.slice(0, i);
        if (i >= text.length) {
          finish();
        } else {
          timer = setTimeout(tick, speed);
        }
      };

      node.addEventListener('click', finish, { once: true });
      timer = setTimeout(tick, speed);
    });
  }

  /* ---------- misc ---------- */

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /* ---------- persistence ---------- */

  const STORAGE_KEY = 'everyWorldLeadsToYou.progress';

  function saveProgress(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* storage can fail (private mode, quota) — the story still
         works in-memory, it just won't resume next visit */
    }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function clearProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  /* ---------- ambient audio (synthesised, no audio files) ---------- */

  const AudioEngine = (() => {
    let ctx = null;
    let master = null;
    let voices = [];
    let running = false;

    function ensureContext() {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }

    // A soft, slow pad built from a few detuned sine oscillators
    // and a gentle filter sweep — intentionally faint and ambient.
    function buildVoices() {
      const notes = [130.81, 164.81, 196.0, 246.94]; // C3 E3 G3 B3 (Cmaj7, warm)
      voices = notes.map((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;

        const gain = ctx.createGain();
        gain.gain.value = 0.0;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.05 + idx * 0.01;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.02;
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(master);

        osc.start();
        lfo.start();

        // stagger each voice in gently
        gain.gain.setTargetAtTime(0.05, ctx.currentTime + idx * 1.2, 2.5);

        return { osc, gain, filter, lfo };
      });
    }

    function start() {
      ensureContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      if (!voices.length) buildVoices();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.55, ctx.currentTime, 1.5);
      running = true;
    }

    function stop() {
      if (!ctx) return;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 1.0);
      running = false;
    }

    function toggle() {
      ensureContext();
      if (!ctx) return false;

      if (running) {
        stop();
      } else {
        start();
      }
      return running;
    }

    function isRunning() {
      return running;
    }

    return { start, stop, toggle, isRunning };
  })();

  return {
    qs, qsa, el,
    sleep, prefersReducedMotion, prefersFinePointer, typewrite,
    randomItem, clamp, lerp,
    saveProgress, loadProgress, clearProgress,
    AudioEngine,
  };
})();