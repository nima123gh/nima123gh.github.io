/**
 * animations.js
 * Ambient, decorative background animation — the "sky is alive" layer.
 * This is entirely separate from the user's memory stars (see stars.js).
 */

import { randomRange } from './utils.js';

let canvas, ctx, width, height;
let dpr = Math.max(1, window.devicePixelRatio || 1);
let ambientStars = [];
let particles = [];
let rafId = null;
let reducedMotion = false;

const AMBIENT_STAR_COUNT_DESKTOP = 220;
const AMBIENT_STAR_COUNT_MOBILE = 110;
const PARTICLE_COUNT = 18;

/** Initialize the fixed full-screen canvas used for the twinkling sky and particles. */
export function initBackground(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  resize();
  seedAmbientStars();
  seedParticles();
  window.addEventListener('resize', () => {
    resize();
    seedAmbientStars();
    seedParticles();
  });

  if (!reducedMotion) {
    loop();
  } else {
    drawFrame(0); // paint one static frame
  }

  // Occasional shooting stars for delight, paused if the user prefers reduced motion.
  if (!reducedMotion) {
    scheduleShootingStar();
  }
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function seedAmbientStars() {
  const count = width < 640 ? AMBIENT_STAR_COUNT_MOBILE : AMBIENT_STAR_COUNT_DESKTOP;
  ambientStars = Array.from({ length: count }, () => ({
    x: randomRange(0, width),
    y: randomRange(0, height * 0.85),
    radius: randomRange(0.4, 1.6),
    baseAlpha: randomRange(0.25, 0.9),
    twinkleSpeed: randomRange(0.4, 1.6),
    phase: randomRange(0, Math.PI * 2),
  }));
}

function seedParticles() {
  particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: randomRange(0, width),
    y: randomRange(0, height),
    radius: randomRange(0.6, 1.8),
    speedY: randomRange(-6, -2) / 60,
    speedX: randomRange(-0.4, 0.4) / 60,
    alpha: randomRange(0.05, 0.18),
  }));
}

function loop(time = 0) {
  drawFrame(time);
  rafId = requestAnimationFrame(loop);
}

function drawFrame(time) {
  ctx.clearRect(0, 0, width, height);

  // Twinkling ambient stars.
  for (const star of ambientStars) {
    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 * star.twinkleSpeed + star.phase);
    const alpha = star.baseAlpha * (0.55 + 0.45 * twinkle);
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(238, 240, 247, ${alpha.toFixed(3)})`;
    ctx.fill();
  }

  // Slow-drifting particles (like faint dust catching moonlight).
  for (const p of particles) {
    p.x += p.speedX;
    p.y += p.speedY;
    if (p.y < -10) p.y = height + 10;
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(155, 140, 242, ${p.alpha})`;
    ctx.fill();
  }
}

function scheduleShootingStar() {
  const delay = randomRange(6000, 16000);
  setTimeout(() => {
    spawnShootingStar();
    scheduleShootingStar();
  }, delay);
}

/** Fire off one shooting star streak across the sky. */
export function spawnShootingStar() {
  if (!canvas) return;
  const streak = document.createElement('div');
  streak.className = 'shooting-star';
  const startX = randomRange(width * 0.1, width * 0.75);
  const startY = randomRange(0, height * 0.35);
  const travel = randomRange(180, 340);
  const angle = randomRange(18, 32); // degrees, downward-right

  streak.style.left = `${startX}px`;
  streak.style.top = `${startY}px`;
  streak.style.setProperty('--travel', `${travel}px`);
  streak.style.setProperty('--angle', `${angle}deg`);

  document.body.appendChild(streak);
  streak.addEventListener('animationend', () => streak.remove());
}

/** Stop the animation loop, e.g. if the tab becomes hidden for a long time (not required, but tidy). */
export function stopBackground() {
  if (rafId) cancelAnimationFrame(rafId);
}
