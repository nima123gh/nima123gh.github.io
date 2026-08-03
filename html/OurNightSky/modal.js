/**
 * modal.js
 * Handles the create / view / edit / delete-confirm modal dialogs.
 * This module owns modal DOM manipulation only — it calls back into main.js
 * for anything that needs to touch Firestore.
 */

import { formatDate, escapeHtml, copyToClipboard, generateId, createImagePreviewUrl, revokeImagePreviewUrl } from './utils.js';
import { renderReplyThread } from './replies.js';

let root;
let handlers = {};
let lastFocusedEl = null;
let currentViewStar = null;
let pendingCreateImageFile = null;
let pendingEditImageFile = null;
let editImageRemoved = false;

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
  createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = createForm.title.value.trim();
    const message = createForm.message.value.trim();
    if (!title || !message) return;

    const submitBtn = createForm.querySelector('.btn--primary');
    let imageUrl = null;
    try {
      if (pendingCreateImageFile && handlers.onUploadImage) {
        if (submitBtn) submitBtn.disabled = true;
        imageUrl = await handlers.onUploadImage(pendingCreateImageFile);
      }
    } catch (err) {
      console.error('Image upload failed, saving the memory without it:', err);
      imageUrl = null;
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }

    handlers.onCreate({ title, message, imageUrl });
    createForm.reset();
    resetImagePicker('create');
    closeAll();
  });

  const editForm = document.getElementById('edit-form');
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = editForm.dataset.id;
    const title = editForm.title.value.trim();
    const message = editForm.message.value.trim();
    if (!title || !message) return;

    const fields = { title, message };
    const submitBtn = editForm.querySelector('.btn--primary');
    if (pendingEditImageFile && handlers.onUploadImage) {
      if (submitBtn) submitBtn.disabled = true;
      fields.imageUrl = await handlers.onUploadImage(pendingEditImageFile);
      if (submitBtn) submitBtn.disabled = false;
    } else if (editImageRemoved) {
      fields.imageUrl = null;
    }

    handlers.onUpdate(id, fields);
    resetImagePicker('edit');
    closeAll();
  });

  setupImagePicker('create');
  setupImagePicker('edit');

  document.getElementById('view-copy-btn').addEventListener('click', async () => {
    if (!currentViewStar) return;
    const text = `${currentViewStar.title}\n\n${currentViewStar.message}`;
    const success = await copyToClipboard(text);
    if (handlers.onCopy) handlers.onCopy(success);
  });

  const replyForm = document.getElementById('reply-form');
  replyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('reply-input');
    const value = input.value.trim();
    if (!value) return;
    submitReply(null, value);
    input.value = '';
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
  currentViewStar = star;
  document.getElementById('view-title').textContent = star.title;
  document.getElementById('view-date').textContent = formatDate(star.createdAt);
  document.getElementById('view-message').textContent = star.message;

  const imgWrap = document.getElementById('view-image-wrap');
  const img = document.getElementById('view-image');
  if (star.imageUrl) {
    img.src = star.imageUrl;
    img.alt = star.title || '';
    imgWrap.hidden = false;
  } else {
    img.src = '';
    imgWrap.hidden = true;
  }

  const favBtn = document.getElementById('view-favorite-btn');
  favBtn.setAttribute('aria-pressed', String(!!star.favorite));
  favBtn.textContent = star.favorite ? '★ مورد علاقه شده' : '☆ مورد علاقه';
  favBtn.onclick = () => handlers.onToggleFavorite(star.id, !star.favorite);

  renderReplies();
  show(modal);
}

function openEditModal(star) {
  closeAll();
  const modal = document.getElementById('edit-modal');
  const form = document.getElementById('edit-form');
  form.dataset.id = star.id;
  form.title.value = star.title;
  form.message.value = star.message;

  resetImagePicker('edit');
  if (star.imageUrl) {
    document.getElementById('edit-image-preview').src = star.imageUrl;
    document.getElementById('edit-image-preview-wrap').hidden = false;
  }

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

// --- Image attachment picker (shared logic for create + edit forms) -------

function setupImagePicker(kind) {
  const input = document.getElementById(`${kind}-image`);
  const wrap = document.getElementById(`${kind}-image-preview-wrap`);
  const img = document.getElementById(`${kind}-image-preview`);
  const removeBtn = document.getElementById(`${kind}-image-remove`);

  input.addEventListener('change', () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (kind === 'create') {
      pendingCreateImageFile = file;
    } else {
      pendingEditImageFile = file;
      editImageRemoved = false;
    }
    if (img.src) revokeImagePreviewUrl(img.src);
    img.src = createImagePreviewUrl(file);
    wrap.hidden = false;
  });

  removeBtn.addEventListener('click', () => {
    input.value = '';
    if (img.src) revokeImagePreviewUrl(img.src);
    img.src = '';
    wrap.hidden = true;
    if (kind === 'create') {
      pendingCreateImageFile = null;
    } else {
      pendingEditImageFile = null;
      editImageRemoved = true;
    }
  });
}

function resetImagePicker(kind) {
  const input = document.getElementById(`${kind}-image`);
  const wrap = document.getElementById(`${kind}-image-preview-wrap`);
  const img = document.getElementById(`${kind}-image-preview`);
  input.value = '';
  if (img.src) revokeImagePreviewUrl(img.src);
  img.src = '';
  wrap.hidden = true;
  if (kind === 'create') {
    pendingCreateImageFile = null;
  } else {
    pendingEditImageFile = null;
    editImageRemoved = false;
  }
}

// --- Threaded replies -------------------------------------------------------

function renderReplies() {
  if (!currentViewStar) return;
  const listEl = document.getElementById('view-replies-list');
  renderReplyThread(listEl, currentViewStar, (parentId, text) => {
    submitReply(parentId, text);
  });
}

function submitReply(parentId, text) {
  if (!currentViewStar || !handlers.onAddReply) return;
  const newReply = {
    id: generateId(),
    parentId: parentId || null,
    text,
    createdAt: new Date().toISOString(),
  };
  const replies = Array.isArray(currentViewStar.replies) ? [...currentViewStar.replies, newReply] : [newReply];
  currentViewStar = { ...currentViewStar, replies };
  renderReplies();
  handlers.onAddReply(currentViewStar.id, replies);
}

export { escapeHtml };
