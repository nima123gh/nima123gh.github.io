/* =========================================================
   ui.js
   Owns the DOM: renders each scene, keeps the constellation
   progress indicator and scene counter in sync, and wires up
   controls (restart / music / fullscreen), keyboard shortcuts,
   tap-sparkles, and the closing letter.
   Exposed as a single global: `UI`.
   ========================================================= */

const UI = (() => {
  let refs = {};
  let constellationPath = null;
  let constellationLength = 0;
  let constellationNodes = [];
  let onRestart = () => { };

  /* ---------------------------------------------------------
     Setup
     --------------------------------------------------------- */

  function init({ restartCallback } = {}) {
    onRestart = restartCallback || onRestart;

    refs = {
      scene: Utils.qs('#scene'),
      constellation: Utils.qs('#constellation'),
      constellationLabel: Utils.qs('#constellation-label'),
      sceneCounter: Utils.qs('#scene-counter'),
      restartBtn: Utils.qs('#restart-btn'),
      musicBtn: Utils.qs('#music-btn'),
      fullscreenBtn: Utils.qs('#fullscreen-btn'),
      letterModal: Utils.qs('#letter-modal'),
      letterClose: Utils.qs('#letter-close'),
      letterContent: Utils.qs('#letter-content'),
      letterCard: Utils.qs('.letter-card'),
      idleLayer: Utils.qs('#idle-quote-layer'),
      cursorGlow: Utils.qs('#cursor-glow'),
      particleCanvas: Utils.qs('#particle-canvas'),
    };

    buildConstellation();
    bindControls();
    bindKeyboard();
    bindLetterDismiss();
    bindTapSparkles();

    return refs;
  }

  /* ---------------------------------------------------------
     Constellation progress indicator
     --------------------------------------------------------- */

  function buildConstellation() {
    const n = Story.timelineCount();
    const svg = refs.constellation;
    const W = 260, H = 36, margin = 14;

    const points = Array.from({ length: n }, (_, i) => {
      const x = n === 1 ? W / 2 : margin + (i * (W - margin * 2)) / (n - 1);
      const y = H / 2 + Math.sin(i * 2.4) * 8;
      return { x, y };
    });

    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const svgns = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(svgns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'constellation-path');
    svg.appendChild(path);
    constellationPath = path;
    constellationLength = path.getTotalLength();
    path.style.strokeDasharray = String(constellationLength);
    path.style.strokeDashoffset = String(constellationLength);

    constellationNodes = points.map((p) => {
      const circle = document.createElementNS(svgns, 'circle');
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.setAttribute('r', 3.2);
      circle.setAttribute('class', 'constellation-node');
      svg.appendChild(circle);
      return circle;
    });
  }

  /**
   * activeIndex: 0..n-1 while a timeline is current, n once every
   * timeline is behind us (convergence/ending).
   */
  function updateProgress(activeIndex, sceneNumber) {
    const n = Story.timelineCount();
    constellationNodes.forEach((node, i) => {
      node.classList.toggle('constellation-node--done', i < activeIndex);
      node.classList.toggle('constellation-node--active', i === activeIndex);
    });
    const fraction = Utils.clamp(activeIndex / (n - 1), 0, 1);
    constellationPath.style.strokeDashoffset = String(constellationLength * (1 - fraction));

    if (activeIndex < n) {
      refs.constellationLabel.textContent = Story.getTimeline(activeIndex).name;
    } else {
      refs.constellationLabel.textContent = '';
    }

    if (sceneNumber != null) {
      refs.sceneCounter.textContent = `صحنه ${sceneNumber} از ${Story.totalSceneCount()}`;
    }
  }

  /* ---------------------------------------------------------
     Small shared scene-building helpers
     --------------------------------------------------------- */

  function sceneShell(extraClass) {
    return Utils.el('div', { className: `scene-inner${extraClass ? ' ' + extraClass : ''}` });
  }

  function continueAffordance(parent, label = 'ادامه') {
    const btn = Utils.el('button', {
      className: 'continue-affordance',
      attrs: { type: 'button' },
    });
    btn.appendChild(Utils.el('span', { text: label }));
    btn.appendChild(Utils.el('span', { className: 'continue-chevron', text: '\u2193', attrs: { 'aria-hidden': 'true' } }));
    parent.appendChild(btn);
    requestAnimationFrame(() => btn.classList.add('continue-affordance--visible'));
    return btn;
  }

  // Slower, more deliberate pacing throughout: typing speed is in ms
  // per character, holdMs is how long a finished line lingers before
  // the next one begins.
  async function fadeLineSequence(textEl, lines, { holdMs = 1900, speed = 38, fadeOutAllButLast = true } = {}) {
    for (let i = 0; i < lines.length; i++) {
      await Utils.typewrite(textEl, lines[i], speed);
      await Utils.sleep(holdMs);
      const isLast = i === lines.length - 1;
      if (!isLast || fadeOutAllButLast === false) {
        textEl.classList.add('scene-text--fading');
        await Utils.sleep(560);
        textEl.textContent = '';
        textEl.classList.remove('scene-text--fading');
      }
    }
  }

  /* ---------------------------------------------------------
     Scenes
     --------------------------------------------------------- */

  function showOpening() {
    return new Promise((resolve) => {
      Animations.crossfade(refs.scene, (container) => {
        const wrap = sceneShell('scene-inner--opening');
        const text = Utils.el('p', { className: 'scene-text scene-text--opening' });
        wrap.appendChild(text);
        container.appendChild(wrap);

        (async () => {
          await Utils.sleep(650);
          await fadeLineSequence(text, Story.opening, { holdMs: 1700, speed: 48 });
          const cont = continueAffordance(wrap, 'شروع کن');
          cont.addEventListener('click', () => resolve(), { once: true });
          cont.focus();
        })();
      });
    });
  }

  function showResumeNotice() {
    return new Promise((resolve) => {
      Animations.crossfade(refs.scene, (container) => {
        const wrap = sceneShell('scene-inner--opening');
        const text = Utils.el('p', { className: 'scene-text', text: 'ادامهٔ داستانت...' });
        wrap.appendChild(text);
        container.appendChild(wrap);
        setTimeout(resolve, 1400);
      });
    });
  }

  function showTimelinePrompt(timeline) {
    return new Promise((resolve) => {
      Animations.crossfade(refs.scene, (container) => {
        const wrap = sceneShell();
        const eyebrow = Utils.el('p', { className: 'scene-eyebrow', text: timeline.name });
        const text = Utils.el('p', { className: 'scene-text' });
        const choices = Utils.el('div', {
          className: 'choices',
          attrs: { role: 'group', 'aria-label': 'انتخاب کن بعدش چه می‌شود' },
        });
        wrap.appendChild(eyebrow);
        wrap.appendChild(text);
        wrap.appendChild(choices);
        container.appendChild(wrap);

        Utils.typewrite(text, timeline.prompt, 36).then(() => {
          timeline.choices.forEach((choice, idx) => {
            const btn = Utils.el('button', {
              className: 'choice-btn',
              attrs: { type: 'button' },
            });
            btn.appendChild(Utils.el('span', {
              className: 'choice-key', text: String(idx + 1), attrs: { 'aria-hidden': 'true' },
            }));
            btn.appendChild(Utils.el('span', { className: 'choice-label', text: choice.label }));
            btn.addEventListener('click', () => resolve(idx), { once: true });
            choices.appendChild(btn);
            requestAnimationFrame(() => btn.classList.add('choice-btn--visible'));
          });
          const first = Utils.qs('.choice-btn', choices);
          if (first) first.focus();
        });
      });
    });
  }

  function showOutcome(timeline, choiceIndex) {
    return new Promise((resolve) => {
      Animations.crossfade(refs.scene, (container) => {
        const choice = timeline.choices[choiceIndex];
        const wrap = sceneShell();
        const eyebrow = Utils.el('p', { className: 'scene-eyebrow', text: choice.label });
        const text = Utils.el('p', { className: 'scene-text' });
        wrap.appendChild(eyebrow);
        wrap.appendChild(text);
        container.appendChild(wrap);

        Utils.typewrite(text, choice.outcome, 36).then(() => {
          const cont = continueAffordance(wrap);
          cont.addEventListener('click', () => resolve(), { once: true });
          cont.focus();
        });
      });
    });
  }

  function showConvergence() {
    return new Promise((resolve) => {
      Animations.crossfade(refs.scene, (container) => {
        const wrap = sceneShell('scene-inner--convergence');
        const text = Utils.el('p', { className: 'scene-text' });
        wrap.appendChild(text);
        container.appendChild(wrap);

        (async () => {
          await fadeLineSequence(text, Story.convergence, { holdMs: 1900, speed: 38 });
          document.body.classList.add('theme--night');
          Animations.ParticleField.setMode('stars');
          await Utils.sleep(1500);
          resolve();
        })();
      });
    });
  }

  function showEnding() {
    return new Promise((resolve) => {
      Animations.crossfade(refs.scene, (container) => {
        const wrap = sceneShell('scene-inner--ending');
        const text = Utils.el('p', { className: 'scene-text scene-text--ending' });
        wrap.appendChild(text);
        container.appendChild(wrap);

        (async () => {
          await fadeLineSequence(text, Story.ending, { holdMs: 2300, speed: 44 });

          const heart = Utils.el('div', {
            className: 'ending-heart', text: Story.endingHeart, attrs: { 'aria-hidden': 'true' },
          });
          const close = Utils.el('p', { className: 'scene-text scene-text--close', text: Story.endingClose });
          wrap.appendChild(heart);
          wrap.appendChild(close);
          requestAnimationFrame(() => {
            heart.classList.add('ending-heart--visible');
            close.classList.add('scene-text--visible');
          });

          await Utils.sleep(2200);

          const actions = Utils.el('div', { className: 'ending-actions' });
          const letterBtn = Utils.el('button', {
            className: 'letter-trigger', text: Story.letter.buttonLabel, attrs: { type: 'button' },
          });
          letterBtn.addEventListener('click', openLetter);
          const replay = Utils.el('button', {
            className: 'replay-link', text: 'دوباره تجربه‌اش کن', attrs: { type: 'button' },
          });
          replay.addEventListener('click', () => onRestart());
          actions.appendChild(letterBtn);
          actions.appendChild(replay);
          wrap.appendChild(actions);
          requestAnimationFrame(() => actions.classList.add('ending-actions--visible'));

          letterBtn.focus();
          resolve();
        })();
      });
    });
  }

  /* ---------------------------------------------------------
     Letter modal
     --------------------------------------------------------- */

  let letterBuilt = false;
  let lastFocused = null;

  function buildLetterContent() {
    if (letterBuilt) return;
    Story.letter.body.forEach((para) => {
      refs.letterContent.appendChild(Utils.el('p', { text: para }));
    });
    letterBuilt = true;
  }

  function openLetter() {
    buildLetterContent();
    lastFocused = document.activeElement;
    refs.letterModal.hidden = false;
    requestAnimationFrame(() => refs.letterModal.classList.add('letter-modal--visible'));
    refs.letterClose.focus();
  }

  function closeLetter() {
    refs.letterModal.classList.remove('letter-modal--visible');
    setTimeout(() => { refs.letterModal.hidden = true; }, 350);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function bindLetterDismiss() {
    refs.letterClose.addEventListener('click', closeLetter);
    refs.letterModal.addEventListener('click', (e) => {
      if (e.target === refs.letterModal) closeLetter();
    });
  }

  function isLetterOpen() {
    return !refs.letterModal.hidden;
  }

  /* ---------------------------------------------------------
     Controls: restart / music / fullscreen
     --------------------------------------------------------- */

  function bindControls() {
    refs.restartBtn.addEventListener('click', () => onRestart());

    refs.musicBtn.addEventListener('click', toggleMusic);

    refs.fullscreenBtn.addEventListener('click', toggleFullscreen);
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
  }

  function toggleMusic() {
    const running = Utils.AudioEngine.toggle();
    refs.musicBtn.classList.toggle('icon-btn--active', running);
    refs.musicBtn.setAttribute('aria-pressed', String(running));
    refs.musicBtn.setAttribute('aria-label', running ? 'قطعِ موسیقی' : 'پخشِ موسیقیِ آرام');
  }

  function toggleFullscreen() {
    const doc = document.documentElement;
    const isFull = document.fullscreenElement || document.webkitFullscreenElement;

    if (isFull) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    } else {
      if (doc.requestFullscreen) {
        doc.requestFullscreen().catch(() => { });
      } else if (doc.webkitRequestFullscreen) {
        doc.webkitRequestFullscreen();
      }
    }
  }

  function updateFullscreenIcon() {
    const active = !!(document.fullscreenElement || document.webkitFullscreenElement);
    refs.fullscreenBtn.setAttribute('aria-label', active ? 'خروج از حالتِ تمام‌صفحه' : 'ورود به حالتِ تمام‌صفحه');
    refs.fullscreenBtn.classList.toggle('icon-btn--active', active);
  }

  /* ---------------------------------------------------------
     Tap / click sparkles — especially tuned for touch: fires on
     pointerdown (mouse, touch, and pen alike) for an instant
     response, right where the finger actually lands.
     --------------------------------------------------------- */

  function bindTapSparkles() {
    const sparkleSelector = '.scene-text, .scene-eyebrow, .scene-text--close, .letter-content p, .ending-heart';

    document.addEventListener('pointerdown', (e) => {
      const target = e.target.closest(sparkleSelector);
      if (!target) return;
      Animations.spawnSparkles(e.clientX, e.clientY);
    });
  }

  /* ---------------------------------------------------------
     Keyboard shortcuts
     --------------------------------------------------------- */

  function bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Escape') {
        if (isLetterOpen()) closeLetter();
        return;
      }

      if (e.key.toLowerCase() === 'm' && !isLetterOpen()) {
        toggleMusic();
        return;
      }

      if (e.key.toLowerCase() === 'f' && !isLetterOpen()) {
        toggleFullscreen();
        return;
      }

      const digit = Number(e.key);
      if (digit >= 1 && digit <= 9) {
        const btns = Utils.qsa('.choice-btn', refs.scene);
        const target = btns[digit - 1];
        if (target) target.click();
        return;
      }

      if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
        const btns = Utils.qsa('.choice-btn', refs.scene);
        if (!btns.length) return;
        const currentIndex = btns.indexOf(document.activeElement);
        if (currentIndex === -1) return;
        e.preventDefault();
        const dir = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
        const next = (currentIndex + dir + btns.length) % btns.length;
        btns[next].focus();
      }
    });
  }

  /* ---------------------------------------------------------
     Idle atmosphere passthroughs
     --------------------------------------------------------- */

  function startAtmosphere() {
    Animations.ParticleField.init(refs.particleCanvas);
    Animations.initCursorGlow(refs.cursorGlow);
    Animations.startIdleQuotes(refs.idleLayer, Story.idleQuotes);
  }

  return {
    init,
    startAtmosphere,
    updateProgress,
    showOpening,
    showResumeNotice,
    showTimelinePrompt,
    showOutcome,
    showConvergence,
    showEnding,
  };
})();