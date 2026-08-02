/**
 * timeline.js
 * The "Memories" side panel: lists every star chronologically, grouped by
 * month, and lets the user jump the camera to any one of them.
 */

import { formatDate, formatMonthYear, toJsDate } from './utils.js';

let listEl, panelEl, toggleBtn;
let onSelectStar = () => { };

export function initTimeline({ toggle, panel, list }, onSelect) {
  toggleBtn = toggle;
  panelEl = panel;
  listEl = list;
  onSelectStar = onSelect;

  toggleBtn.addEventListener('click', () => {
    const isOpen = panelEl.classList.toggle('timeline-panel--open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
  });

  document.getElementById('timeline-close').addEventListener('click', closeTimeline);
}

export function closeTimeline() {
  panelEl.classList.remove('timeline-panel--open');
  toggleBtn.setAttribute('aria-expanded', 'false');
}

/** Re-render the full timeline list from the current star set (newest first). */
export function renderTimeline(stars) {
  listEl.innerHTML = '';

  if (stars.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'timeline-empty';
    empty.textContent = 'آسمون خالیه الان، روی اسمون بزن تا بتونی خاطره رو اضافه کنی همه عمرم';
    listEl.appendChild(empty);
    return;
  }

  const sorted = [...stars].sort((a, b) => (toJsDate(b.createdAt) || 0) - (toJsDate(a.createdAt) || 0));

  let currentGroup = null;
  let groupEl = null;

  for (const star of sorted) {
    const groupLabel = formatMonthYear(star.createdAt);
    if (groupLabel !== currentGroup) {
      currentGroup = groupLabel;
      const heading = document.createElement('h3');
      heading.className = 'timeline-group-label';
      heading.textContent = groupLabel || 'Undated';
      listEl.appendChild(heading);
      groupEl = document.createElement('div');
      groupEl.className = 'timeline-group';
      listEl.appendChild(groupEl);
    }

    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'timeline-item';
    if (star.favorite) item.classList.add('timeline-item--favorite');
    item.dataset.id = star.id;

    const dot = document.createElement('span');
    dot.className = 'timeline-item__dot';
    dot.style.setProperty('--star-color', star.color || 'var(--star-light)');

    const text = document.createElement('span');
    text.className = 'timeline-item__text';

    const title = document.createElement('span');
    title.className = 'timeline-item__title';
    title.textContent = star.title;

    const date = document.createElement('span');
    date.className = 'timeline-item__date';
    date.textContent = formatDate(star.createdAt);

    text.appendChild(title);
    text.appendChild(date);
    item.appendChild(dot);
    item.appendChild(text);
    item.addEventListener('click', () => onSelectStar(star));

    groupEl.appendChild(item);
  }
}