/**
 * search.js
 * Text search across star titles + messages. Dims non-matching stars in
 * the sky and lets the toolbar toggle the search input open/closed.
 */

import { debounce } from './utils.js';
import { applyVisibilityFilter } from './stars.js';

let getAllStars = () => [];
let onResultsChange = () => { };

export function initSearch({ toggleBtn, panel, input, resultsEl }, getStars, onResults) {
  getAllStars = getStars;
  onResultsChange = onResults;

  toggleBtn.addEventListener('click', () => {
    const isOpen = panel.classList.toggle('search-panel--open');
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) requestAnimationFrame(() => input.focus());
    else clearSearch(input, resultsEl);
  });

  const runSearch = debounce(() => {
    const term = input.value.trim().toLowerCase();
    if (!term) {
      applyVisibilityFilter(null);
      resultsEl.innerHTML = '';
      onResultsChange([]);
      return;
    }
    const matches = getAllStars().filter(
      (s) => s.title.toLowerCase().includes(term) || s.message.toLowerCase().includes(term)
    );
    applyVisibilityFilter(new Set(matches.map((s) => s.id)));
    renderResults(matches, resultsEl);
    onResultsChange(matches);
  }, 150);

  input.addEventListener('input', runSearch);
}

function renderResults(matches, resultsEl) {
  resultsEl.innerHTML = '';
  if (matches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'search-empty';
    empty.textContent = 'هیج خاطره ای پیدا نکردم زندگیم. شاید اشتباه نوشتی دخترم';
    resultsEl.appendChild(empty);
    return;
  }
  for (const star of matches) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'search-result';
    item.dataset.id = star.id;
    item.textContent = star.title;
    resultsEl.appendChild(item);
  }
}

function clearSearch(input, resultsEl) {
  input.value = '';
  resultsEl.innerHTML = '';
  applyVisibilityFilter(null);
  onResultsChange([]);
}
