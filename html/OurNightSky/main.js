/**
 * main.js
 * Entry point. Wires together Firestore (firebase.js), the star renderer
 * (stars.js), modals (modal.js), the ambient background (animations.js),
 * search (search.js), the timeline (timeline.js), and general chrome (ui.js).
 */

import { subscribeToStars, createStar, updateStar, deleteStar, isFirebaseConfigured, uploadStarImage, deleteStarImageByUrl } from './firebase.js';
import { renderStar, removeStarWithFade, clearAllStars, pulseHighlight, getStarElement } from './stars.js';
import { initModals, openCreateModal, openViewModal } from './modal.js';
import { initBackground } from './animations.js';
import { initSearch } from './search.js';
import { initTimeline, renderTimeline, closeTimeline } from './timeline.js';
import { updateCounter, initThemeToggle, initMusicToggle, initExport, initImport, initSurprise, initMoreMenu, showToast } from './ui.js';
import { generateId, randomRange, randomItem } from './utils.js';

// --- Virtual sky world size. Larger than any viewport so the sky feels vast. ---
const WORLD_WIDTH = 3600;
const WORLD_HEIGHT = 2200;
const EDGE_MARGIN = 160; // keep stars off the very edge
const STAR_COLORS = ['#fdf6e3', '#f4c95d', '#cdd7f0', '#e8a5b8'];

let starsById = new Map();
let offsetX = 0;
let offsetY = 0;
let viewportEl, worldEl;

document.addEventListener('DOMContentLoaded', init);

function init() {
  viewportEl = document.getElementById('sky-viewport');
  worldEl = document.getElementById('sky-world');
  worldEl.style.width = `${WORLD_WIDTH}px`;
  worldEl.style.height = `${WORLD_HEIGHT}px`;

  centerViewOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, false);

  initBackground(document.getElementById('bg-canvas'));
  setupPanAndCreate();

  initModals(document.getElementById('modal-root'), {
    onCreate: handleCreateStar,
    onUpdate: handleUpdateStar,
    onDelete: handleDeleteStar,
    onToggleFavorite: handleToggleFavorite,
    onUploadImage: handleUploadImage,
    onAddReply: handleAddReply,
    onCopy: handleCopyResult,
    getStar: (id) => starsById.get(id),
  });

  initTimeline(
    {
      toggle: document.getElementById('timeline-toggle'),
      panel: document.getElementById('timeline-panel'),
      list: document.getElementById('timeline-list'),
    },
    (star) => {
      closeTimeline();
      focusStar(star);
    }
  );

  initSearch(
    {
      toggleBtn: document.getElementById('search-toggle'),
      panel: document.getElementById('search-panel'),
      input: document.getElementById('search-input'),
      resultsEl: document.getElementById('search-results'),
    },
    () => Array.from(starsById.values()),
    () => { }
  );
  document.getElementById('search-results').addEventListener('click', (e) => {
    const btn = e.target.closest('.search-result');
    if (!btn) return;
    const star = starsById.get(btn.dataset.id);
    if (star) focusStar(star);
  });

  initMoreMenu(document.getElementById('more-toggle'), document.getElementById('more-menu'));
  initThemeToggle(document.getElementById('theme-toggle'));
  initMusicToggle(document.getElementById('music-toggle'));
  initExport(document.getElementById('export-btn'), () => Array.from(starsById.values()));
  initImport(document.getElementById('import-btn'), document.getElementById('import-file'), handleImport);
  initSurprise(document.getElementById('surprise-btn'), () => Array.from(starsById.values()), (star) => {
    focusStar(star);
    setTimeout(() => openViewModal(star), 550);
  });

  if (!isFirebaseConfigured()) {
    showToast('Add your Firebase config in firebase.js to start syncing memories.', true);
  }

  subscribeToStars(handleStarsSnapshot, () => {
    showToast("Couldn't connect to your shared sky. Check your Firebase setup.", true);
  });
}

// --- Firestore sync -------------------------------------------------------

function handleStarsSnapshot(stars) {
  const incomingIds = new Set(stars.map((s) => s.id));

  // Remove stars that no longer exist.
  for (const id of starsById.keys()) {
    if (!incomingIds.has(id)) starsById.delete(id);
  }

  const isFirstLoad = starsById.size === 0 && stars.length > 0 && worldEl.children.length === 0;

  for (const star of stars) {
    const isNew = !starsById.has(star.id);
    starsById.set(star.id, star);
    renderStar(worldEl, star, openViewModal, { animateIn: isNew && !isFirstLoad });
  }

  updateCounter(starsById.size);
  renderTimeline(Array.from(starsById.values()));
}

async function handleCreateStar({ title, message, imageUrl }) {
  const form = document.getElementById('create-form');
  const x = parseFloat(form.dataset.x) || WORLD_WIDTH / 2;
  const y = parseFloat(form.dataset.y) || WORLD_HEIGHT / 2;

  const star = {
    title,
    message,
    x,
    y,
    color: randomItem(STAR_COLORS),
    size: randomRange(2.6, 5),
    favorite: false,
    imageUrl: imageUrl || null,
    replies: [],
    createdAt: new Date().toISOString(),
  };

  try {
    console.log("Saving star to Firestore...", star);
    await createStar(star);
    showToast('یه ستاره به قشنگی چشمات داره توی آسمون میدرخشه');
  } catch (err) {
    console.error("Firestore createStar error:", err);
    showToast("Couldn't save that memory. Check your connection.", true);
    throw err;
  }
}

async function handleUpdateStar(id, fields) {
  const previous = starsById.get(id);
  try {
    await updateStar(id, fields);
    showToast('خاطرات بروزرسانی شد');
    if (previous && Object.prototype.hasOwnProperty.call(fields, 'imageUrl') && previous.imageUrl && previous.imageUrl !== fields.imageUrl) {
      deleteStarImageByUrl(previous.imageUrl);
    }
  } catch (err) {
    console.error(err);
    showToast("خطا در بروزرسانی", true);
  }
}

async function handleDeleteStar(id) {
  const star = starsById.get(id);
  try {
    if (star) await removeStarWithFade(star);
    await deleteStar(id);
    if (star && star.imageUrl) deleteStarImageByUrl(star.imageUrl);
  } catch (err) {
    console.error(err);
    showToast("خطا در پاک کردن خاطره", true);
  }
}

async function handleUploadImage(file) {
  if (!file) return null;
  try {
    console.log("Attempting to upload image to Firebase Storage:", file.name);
    const url = await uploadStarImage(file);
    console.log("Image uploaded successfully! URL:", url);
    return url;
  } catch (err) {
    console.error("Firebase Storage Upload Error:", err);
    showToast('عکس آپلود نشد. تنظیمات Firebase Storage رو چک کن.', true);
    throw err; // Throws error to notify modal.js so it re-enables the submit button
  }
}

async function handleAddReply(id, replies) {
  try {
    await updateStar(id, { replies });
  } catch (err) {
    console.error(err);
    showToast('پاسخ ذخیره نشد.', true);
  }
}

function handleCopyResult(success) {
  showToast(success ? 'متن خاطره کپی شد' : 'کپی نشد، دوباره امتحان کن', !success);
}

async function handleToggleFavorite(id, favorite) {
  try {
    await updateStar(id, { favorite });
    const updated = { ...starsById.get(id), favorite };
    starsById.set(id, updated);
    renderStar(worldEl, updated, openViewModal);
    document.getElementById('view-favorite-btn').textContent = favorite ? '★ علاقه مندی شده' : '☆ علاقه مندی';
    document.getElementById('view-favorite-btn').setAttribute('aria-pressed', String(favorite));
  } catch (err) {
    console.error(err);
    showToast("Couldn't update favorite status.", true);
  }
}

async function handleImport(stars) {
  for (const raw of stars) {
    const star = {
      title: String(raw.title || 'Untitled memory'),
      message: String(raw.message || ''),
      x: Number.isFinite(raw.x) ? raw.x : randomRange(EDGE_MARGIN, WORLD_WIDTH - EDGE_MARGIN),
      y: Number.isFinite(raw.y) ? raw.y : randomRange(EDGE_MARGIN, WORLD_HEIGHT - EDGE_MARGIN),
      color: raw.color || randomItem(STAR_COLORS),
      size: raw.size || randomRange(2.6, 5),
      favorite: !!raw.favorite,
      imageUrl: raw.imageUrl || null,
      replies: Array.isArray(raw.replies) ? raw.replies : [],
      createdAt: raw.createdAt || new Date().toISOString(),
    };
    await createStar(star);
  }
}

// --- Pan / click-to-create camera system ----------------------------------

function setupPanAndCreate() {
  let isDragging = false;
  let dragMoved = false;
  let startX = 0;
  let startY = 0;
  let startOffsetX = 0;
  let startOffsetY = 0;

  viewportEl.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.star')) return;
    isDragging = true;
    dragMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    startOffsetX = offsetX;
    startOffsetY = offsetY;
    viewportEl.setPointerCapture(e.pointerId);
    viewportEl.classList.add('sky-viewport--dragging');
  });

  viewportEl.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    setOffset(startOffsetX + dx, startOffsetY + dy, false);
  });

  viewportEl.addEventListener('pointerup', (e) => {
    isDragging = false;
    viewportEl.classList.remove('sky-viewport--dragging');
    if (!dragMoved && !e.target.closest('.star')) {
      const worldX = e.clientX - offsetX;
      const worldY = e.clientY - offsetY;
      openCreateModal(clampCoord(worldX, WORLD_WIDTH), clampCoord(worldY, WORLD_HEIGHT));
    }
  });

  window.addEventListener('resize', () => setOffset(offsetX, offsetY, false));
}

function clampCoord(value, max) {
  return Math.min(Math.max(value, EDGE_MARGIN), max - EDGE_MARGIN);
}

function setOffset(x, y, animate) {
  const vw = viewportEl.clientWidth;
  const vh = viewportEl.clientHeight;
  const minX = Math.min(0, vw - WORLD_WIDTH);
  const minY = Math.min(0, vh - WORLD_HEIGHT);
  offsetX = Math.min(0, Math.max(minX, x));
  offsetY = Math.min(0, Math.max(minY, y));
  worldEl.style.transition = animate ? 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1)' : 'none';
  worldEl.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
}

function centerViewOn(worldX, worldY, animate = true) {
  const vw = viewportEl ? viewportEl.clientWidth : window.innerWidth;
  const vh = viewportEl ? viewportEl.clientHeight : window.innerHeight;
  setOffset(vw / 2 - worldX, vh / 2 - worldY, animate);
}

function focusStar(star) {
  centerViewOn(star.x, star.y, true);
  setTimeout(() => pulseHighlight(star.id), 500);
}
