/* =========================================================
   animations.js
   Handles background canvas starfields/dust, scene transitions,
   cursor glow, tap sparkles, and idle floating quotes.
   Exposed as a single global: `Animations`.
   ========================================================= */

const Animations = (() => {

  /* ---------- 1. Canvas Particle Field (Stars & Dust) ---------- */

  const ParticleField = (() => {
    let canvas = null;
    let ctx = null;
    let particles = [];
    let width = 0;
    let height = 0;
    let animId = null;
    let mode = 'dust'; // 'dust' or 'stars'

    function resize() {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.6 + 0.2,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    }

    function init(canvasEl) {
      if (!canvasEl) return;
      canvas = canvasEl;
      ctx = canvas.getContext('2d');

      resize();
      window.removeEventListener('resize', resize);
      window.addEventListener('resize', resize);

      const count = Math.min(Math.floor((width * height) / 9000), 120);
      particles = Array.from({ length: count }, createParticle);

      if (animId) cancelAnimationFrame(animId);
      loop();
    }

    function setMode(newMode) {
      mode = newMode;
    }

    function loop() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const isNight = mode === 'stars';

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.pulsePhase += p.pulseSpeed;
        const currentAlpha = p.alpha + Math.sin(p.pulsePhase) * 0.2;
        const clampedAlpha = Math.max(0.05, Math.min(1, currentAlpha));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        if (isNight) {
          ctx.fillStyle = `rgba(241, 236, 227, ${clampedAlpha * 0.85})`;
        } else {
          ctx.fillStyle = `rgba(227, 183, 120, ${clampedAlpha * 0.5})`;
        }

        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    }

    return { init, setMode };
  })();

  /* ---------- 2. Scene Transitions ---------- */

  function crossfade(container, buildFn) {
    return new Promise((resolve) => {
      container.classList.remove('scene--in');
      container.classList.add('scene--out');

      setTimeout(() => {
        container.innerHTML = '';
        buildFn(container);

        container.classList.remove('scene--out');
        container.classList.add('scene--in');

        setTimeout(resolve, 650);
      }, 650);
    });
  }

  /* ---------- 3. Cursor Glow ---------- */

  function initCursorGlow(glowEl) {
    if (!glowEl || !Utils.prefersFinePointer()) {
      if (glowEl) glowEl.style.display = 'none';
      return;
    }

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let currentX = targetX;
    let currentY = targetY;

    window.addEventListener('pointermove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    function renderGlow() {
      currentX = Utils.lerp(currentX, targetX, 0.08);
      currentY = Utils.lerp(currentY, targetY, 0.08);
      glowEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      requestAnimationFrame(renderGlow);
    }

    renderGlow();
  }

  /* ---------- 4. Tap Sparkles ---------- */

  function spawnSparkles(x, y) {
    if (Utils.prefersReducedMotion()) return;

    const count = 6;
    for (let i = 0; i < count; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 45 + 15;
      const dx = `${Math.cos(angle) * distance}px`;
      const dy = `${Math.sin(angle) * distance}px`;
      const size = `${Math.random() * 4 + 2}px`;

      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      sparkle.style.width = size;
      sparkle.style.height = size;
      sparkle.style.setProperty('--dx', dx);
      sparkle.style.setProperty('--dy', dy);

      const isGold = Math.random() > 0.3;
      sparkle.style.background = isGold ? '#e3b778' : '#d89aa0';
      sparkle.style.boxShadow = isGold
        ? '0 0 6px rgba(227, 183, 120, 0.8)'
        : '0 0 6px rgba(216, 154, 160, 0.8)';

      document.body.appendChild(sparkle);

      setTimeout(() => {
        sparkle.remove();
      }, 700);
    }
  }

  /* ---------- 5. Idle Floating Quotes ---------- */

  function startIdleQuotes(container, quotes) {
    if (!container || !quotes || !quotes.length || Utils.prefersReducedMotion()) return;

    let index = 0;

    function spawnQuote() {
      const text = quotes[index % quotes.length];
      index++;

      const quoteEl = document.createElement('div');
      quoteEl.className = 'idle-quote';
      quoteEl.textContent = text;

      const randomX = Math.random() * 60 + 20; // Keep within 20% to 80% screen width
      quoteEl.style.left = `${randomX}%`;

      container.appendChild(quoteEl);

      requestAnimationFrame(() => {
        quoteEl.classList.add('idle-quote--visible');
      });

      setTimeout(() => {
        quoteEl.remove();
      }, 9500);
    }

    setInterval(spawnQuote, 14000);
    setTimeout(spawnQuote, 4000);
  }

  return {
    ParticleField,
    crossfade,
    initCursorGlow,
    spawnSparkles,
    startIdleQuotes,
  };
})();