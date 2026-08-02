/**
 * ui.js
 * Chrome around the sky: the star counter, theme toggle, generated ambient
 * music toggle (via Web Audio, so no audio file is needed), export/import,
 * and toast notifications.
 */

import { downloadJson, readJsonFile } from './utils.js';

let audioCtx = null;
let ambientNodes = null;
let isPlaying = false;

/** Update the "⭐ N memories" counter badge. */
export function updateCounter(count) {
  const el = document.getElementById('star-counter');
  el.textContent = `⭐ ${count} ${count === 1 ? 'خاطره' : 'خاطرات'}`;
}

/** Wire the light/dark (dusk/midnight) theme toggle. */
export function initThemeToggle(btn) {
  const icon = btn.querySelector('.more-menu__icon');
  const label = btn.querySelector('span:last-child');
  btn.addEventListener('click', () => {
    const isDusk = document.body.classList.toggle('theme-dusk');
    btn.setAttribute('aria-pressed', String(isDusk));
    if (icon) icon.textContent = isDusk ? '🔥' : '🌙';
    if (label) label.textContent = isDusk ? 'آسمون شب' : 'آسمون غروب';
  });
}

/** Wire the ambient background music toggle. Generates a soft synth pad — no audio file required. */
export function initMusicToggle(btn) {
  const icon = btn.querySelector('.more-menu__icon');
  const label = btn.querySelector('span:last-child');
  btn.addEventListener('click', () => {
    isPlaying ? stopAmbient() : startAmbient();
    isPlaying = !isPlaying;
    btn.setAttribute('aria-pressed', String(isPlaying));
    if (icon) icon.textContent = isPlaying ? '🔊' : '🔈';
    if (label) label.textContent = isPlaying ? 'میوت' : 'موسیقی';
  });
}

/**
 * Wire the "more" overflow menu (export / import / music / theme) — used so
 * the main toolbar stays uncluttered and thumb-friendly on phones.
 */
export function initMoreMenu(toggleBtn, menuEl) {
  const close = () => {
    menuEl.classList.remove('more-menu--open');
    toggleBtn.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    menuEl.classList.add('more-menu--open');
    toggleBtn.setAttribute('aria-expanded', 'true');
  };

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuEl.classList.contains('more-menu--open') ? close() : open();
  });

  // Let the item's own action run first, then close shortly after so any
  // state change (like a checkmark) is still briefly visible.
  menuEl.addEventListener('click', (e) => {
    if (e.target.closest('.more-menu__item')) setTimeout(close, 160);
  });

  document.addEventListener('click', (e) => {
    if (!menuEl.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

function startAmbient() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;
  masterGain.connect(audioCtx.destination);
  masterGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 2);

  // A few slow, detuned sine pads for a soft, breathing drone.
  const freqs = [98, 123.5, 147, 196];
  const oscillators = freqs.map((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const gain = audioCtx.createGain();
    gain.gain.value = 0.6 / freqs.length;

    const lfo = audioCtx.createOscillator();
    lfo.frequency.value = 0.05 + i * 0.01;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 3;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);
    lfo.start();

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    return { osc, lfo };
  });

  ambientNodes = { masterGain, oscillators };
}

function stopAmbient() {
  if (!ambientNodes) return;
  const { masterGain, oscillators } = ambientNodes;
  masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
  setTimeout(() => {
    oscillators.forEach(({ osc, lfo }) => {
      osc.stop();
      lfo.stop();
    });
  }, 1300);
  ambientNodes = null;
}

/** Wire the export button to download all stars as JSON. */
export function initExport(btn, getStars) {
  btn.addEventListener('click', () => {
    downloadJson(getStars(), 'our-night-sky-memories.json');
    showToast('خاطره افزوده شد');
  });
}

/** Wire the import button + hidden file input to bulk-create stars from JSON. */
export function initImport(btn, fileInput, onImport) {
  btn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      const data = await readJsonFile(file);
      if (!Array.isArray(data)) throw new Error('Expected a JSON array of stars.');
      await onImport(data);
      showToast(`Imported ${data.length} ${data.length === 1 ? 'memory' : 'memories'}.`);
    } catch (err) {
      console.error(err);
      showToast("That file couldn't be read as memories.", true);
    } finally {
      fileInput.value = '';
    }
  });
}

/** Wire the "Surprise Me" button. */
export function initSurprise(btn, getStars, onPick) {
  btn.addEventListener('click', () => {
    const stars = getStars();
    if (stars.length === 0) {
      showToast('خر کوچولم اول خاطره بزار بعد واست شانسی یکیشو میارمممم');
      return;
    }
    const pick = stars[Math.floor(Math.random() * stars.length)];
    onPick(pick);
  });
}

let toastTimer = null;
/** Show a small transient toast message. */
export function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast${isError ? ' toast--error' : ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3200);
}