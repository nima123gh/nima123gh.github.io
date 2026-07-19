/**
 * modal.js
 * Handles the create / view / edit / delete-confirm modal dialogs.
 * This module owns modal DOM manipulation only — it calls back into main.js
 * for anything that needs to touch Firestore.
 */

import { formatDate, escapeHtml } from './utils.js';

let root;
let handlers = {};
let lastFocusedEl = null;

/** Wire up the modal system once at startup. */
export function initModals(rootEl, callbacks) {
  root = rootEl;
  handlers = callbacks; // { onCreate, onUpdate, onDelete }

  root.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', closeAll);
  });

  root.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });

  const createForm = document.getElementById('create-form');
  createForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = createForm.title.value.trim();
    const message = createForm.message.value.trim();
    if (!title || !message) return;
    handlers.onCreate({ title, message });
    createForm.reset();
    closeAll();
  });

  const editForm = document.getElementById('edit-form');
  editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = editForm.dataset.id;
    const title = editForm.title.value.trim();
    const message = editForm.message.value.trim();
    if (!title || !message) return;
    handlers.onUpdate(id, { title, message });
    closeAll();
  });

  document.getElementById('view-edit-btn').addEventListener('click', () => {
    const id = document.getElementById('view-modal').dataset.id;
    const star = handlers.getStar(id);
    if (star) openEditModal(star);
  });

  document.getElementById('view-delete-btn').addEventListener('click', () => {
    const id = document.getElementById('view-modal').dataset.id;
    openDeleteConfirm(id);
  });

  document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    const id = document.getElementById('delete-modal').dataset.id;
    handlers.onDelete(id);
    closeAll();
  });
}

/** Open the "plant a new star" modal at a given world position. */
export function openCreateModal(worldX, worldY) {
  const modal = document.getElementById('create-modal');
  const form = document.getElementById('create-form');
  form.dataset.x = worldX;
  form.dataset.y = worldY;
  show(modal);
  requestAnimationFrame(() => form.title.focus());
}

/** Open the read-only "view memory" modal for a given star. */
export function openViewModal(star) {
  const modal = document.getElementById('view-modal');
  modal.dataset.id = star.id;
  document.getElementById('view-title').textContent = star.title;
  document.getElementById('view-date').textContent = formatDate(star.createdAt);
  document.getElementById('view-message').textContent = star.message;
  const favBtn = document.getElementById('view-favorite-btn');
  favBtn.setAttribute('aria-pressed', String(!!star.favorite));
  favBtn.textContent = star.favorite ? '★ مورد علاقه شده' : '☆ مورد علاقه';
  favBtn.onclick = () => handlers.onToggleFavorite(star.id, !star.favorite);
  show(modal);
}

function openEditModal(star) {
  closeAll();
  const modal = document.getElementById('edit-modal');
  const form = document.getElementById('edit-form');
  form.dataset.id = star.id;
  form.title.value = star.title;
  form.message.value = star.message;
  show(modal);
  requestAnimationFrame(() => form.title.focus());
}

function openDeleteConfirm(id) {
  closeAll();
  const modal = document.getElementById('delete-modal');
  modal.dataset.id = id;
  show(modal);
}

function show(modal) {
  lastFocusedEl = document.activeElement;
  root.classList.add('modal-root--open');
  root.querySelectorAll('.modal').forEach((m) => m.classList.remove('modal--visible'));
  modal.classList.add('modal--visible');
  document.body.classList.add('no-scroll');
}

function closeAll() {
  root.classList.remove('modal-root--open');
  root.querySelectorAll('.modal').forEach((m) => m.classList.remove('modal--visible'));
  document.body.classList.remove('no-scroll');
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') lastFocusedEl.focus();
}

export function isAnyModalOpen() {
  return root.classList.contains('modal-root--open');
}

export { escapeHtml };
