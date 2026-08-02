/**
 * utils.js
 * Small, dependency-free helper functions shared across modules.
 */

/** Generate a reasonably unique id for a star created before Firestore assigns one. */
export function generateId() {
  return `star_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Clamp a number between a min and max. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Return a random float between min (inclusive) and max (exclusive). */
export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/** Return a random item from an array. */
export function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Format a JS Date (or Firestore Timestamp-like object) into a soft, readable string. */
export function formatDate(dateLike) {
  const date = toJsDate(dateLike);
  if (!date) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format a date as a short label for timeline grouping, e.g. "March 2026". */
export function formatMonthYear(dateLike) {
  const date = toJsDate(dateLike);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
}

/** Normalize Firestore Timestamp objects, ISO strings, numbers, or Date instances into a Date. */
export function toJsDate(dateLike) {
  if (!dateLike) return null;
  if (dateLike instanceof Date) return dateLike;
  if (typeof dateLike.toDate === 'function') return dateLike.toDate();
  if (typeof dateLike === 'number') return new Date(dateLike);
  if (typeof dateLike === 'string') {
    const parsed = new Date(dateLike);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/** Debounce a function so it only runs after a quiet period. */
export function debounce(fn, wait = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

/** Escape text before inserting as HTML to avoid breaking markup with user input. */
export function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Trigger a browser download of a JSON blob. */
export function downloadJson(data, filename = 'our-night-sky-memories.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Read a File object (from an <input type="file">) as parsed JSON. */
export function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Returns true if two anniversary dates (month/day) match "today", used for golden stars. */
export function isAnniversaryOf(dateLike, today = new Date()) {
  const date = toJsDate(dateLike);
  if (!date) return false;
  return date.getMonth() === today.getMonth() && date.getDate() === today.getDate() && date.getFullYear() !== today.getFullYear();
}

/** Copy plain text to the clipboard, with a legacy fallback for older/insecure contexts. */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // fall through to the legacy fallback below
    }
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    return false;
  }
}

/** Create a temporary local preview URL for a selected image file (attachments). */
export function createImagePreviewUrl(file) {
  return URL.createObjectURL(file);
}

/** Release a preview URL created with createImagePreviewUrl. Safe to call on non-blob URLs too. */
export function revokeImagePreviewUrl(url) {
  if (url) URL.revokeObjectURL(url);
}