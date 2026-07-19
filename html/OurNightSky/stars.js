/**
 * stars.js
 * Rendering layer for memory stars (as opposed to the decorative ambient
 * stars drawn on canvas in animations.js). Each memory star is a real DOM
 * element positioned inside #sky-world so it can be clicked, focused, and
 * animated individually.
 */

import { randomRange, isAnniversaryOf } from './utils.js';

const starElements = new Map(); // id -> element

/**
 * Create (or update) the DOM element for a star inside the given world container.
 * @param {HTMLElement} worldEl the #sky-world container
 * @param {object} star the star data record
 * @param {(star: object) => void} onOpen callback when the star is clicked
 * @param {{ animateIn?: boolean }} options
 */
export function renderStar(worldEl, star, onOpen, options = {}) {
  let el = starElements.get(star.id);

  if (!el) {
    el = document.createElement('button');
    el.type = 'button';
    el.className = 'star';
    el.setAttribute('aria-label', `Memory: ${star.title || 'Untitled'}`);
    worldEl.appendChild(el);
    starElements.set(star.id, el);

    // Assign stable-per-star random visual variation, seeded by id so it
    // doesn't reshuffle every render.
    const seed = hashSeed(star.id);
    const size = star.size || lerp(2.4, 5.2, seed(0));
    const twinkleDuration = lerp(2.6, 5.4, seed(1));
    const twinkleDelay = seed(2) * -5;
    const floatDuration = lerp(6, 11, seed(3));
    el.style.setProperty('--size', `${size}px`);
    el.style.setProperty('--twinkle-duration', `${twinkleDuration}s`);
    el.style.setProperty('--twinkle-delay', `${twinkleDelay}s`);
    el.style.setProperty('--float-duration', `${floatDuration}s`);

    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onOpen(star);
    });

    if (options.animateIn) {
      el.classList.add('star--entering');
      requestAnimationFrame(() => {
        el.classList.add('star--enter-active');
      });
      setTimeout(() => el.classList.remove('star--entering', 'star--enter-active'), 900);
    }
  }

  positionStar(el, star);
  el.style.setProperty('--star-color', star.color || 'var(--star-light)');
  el.classList.toggle('star--favorite', !!star.favorite);
  el.classList.toggle('star--golden', !!star.favorite || isAnniversaryOf(star.createdAt));
  el.dataset.id = star.id;

  return el;
}

function positionStar(el, star) {
  el.style.left = `${star.x}px`;
  el.style.top = `${star.y}px`;
}

/** Remove a star's DOM element with a soft fade, then delete it. */
export function removeStarWithFade(star) {
  const el = starElements.get(star.id);
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    el.classList.add('star--leaving');
    el.addEventListener(
      'transitionend',
      () => {
        el.remove();
        starElements.delete(star.id);
        resolve();
      },
      { once: true }
    );
    // Safety net in case transitionend doesn't fire.
    setTimeout(() => {
      if (starElements.has(star.id)) {
        el.remove();
        starElements.delete(star.id);
        resolve();
      }
    }, 700);
  });
}

/** Remove every rendered star element and clear internal state, e.g. on full re-sync. */
export function clearAllStars() {
  for (const el of starElements.values()) el.remove();
  starElements.clear();
}

/** Get the DOM element for a given star id, if rendered. */
export function getStarElement(id) {
  return starElements.get(id);
}

/** Briefly highlight a star (used by search + timeline focus). */
export function pulseHighlight(id) {
  const el = starElements.get(id);
  if (!el) return;
  el.classList.add('star--highlight');
  setTimeout(() => el.classList.remove('star--highlight'), 1600);
}

/** Dim every star except the ones whose id is in the visible set (used by search). */
export function applyVisibilityFilter(visibleIds) {
  for (const [id, el] of starElements.entries()) {
    const visible = !visibleIds || visibleIds.has(id);
    el.classList.toggle('star--dimmed', !visible);
  }
}

// --- small deterministic pseudo-random helpers so a star's "randomness" ---
// --- stays stable across re-renders instead of jumping around. -----------

function hashSeed(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return (offset) => {
    const x = Math.sin(h + offset * 999) * 10000;
    return x - Math.floor(x);
  };
}

function lerp(min, max, t) {
  return min + (max - min) * t;
}

export { randomRange };
