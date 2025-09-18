const HIDDEN_CLASS = 'trello-views-hidden-list';
const STYLE_ID = 'trello-views-style';
const STORAGE_PREFIX = 'trelloViews:lastSelection:';

let currentBoardKey = null;
let currentSelection = { allColumns: true, activeColumns: '' };
let lastBadgeFilteredState = null;
let locationWatcherId = null;
let mutationObserver = null;
let pendingMutationApply = false;
let lastKnownHref = window.location.href;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${HIDDEN_CLASS} {
      display: none !important;
    }
  `;

  (document.head || document.documentElement).appendChild(style);
}

function getBoardKeyFromLocation() {
  try {
    const { pathname } = window.location;
    const match = pathname.match(/\/b\/([^/]+)/);
    if (match) {
      return match[1];
    }
  } catch (err) {
    console.warn('Trello Views: Failed to derive board key.', err);
  }
  return null;
}

function getBoardLists() {
  const modernLists = Array.from(document.querySelectorAll('[data-testid="list-wrapper"]'));
  if (modernLists.length) {
    return modernLists;
  }
  return Array.from(document.querySelectorAll('.js-list'));
}

function extractListTitle(list) {
  const titleSelectors = [
    '[data-testid="list-name"] span',
    '[data-testid="list-name"] button span',
    '[data-testid="list-name-textarea"]',
    '[data-testid="list-header"] [data-testid="list-name"]',
    'h2'
  ];

  for (const selector of titleSelectors) {
    const element = list.querySelector(selector);
    const text = element && element.textContent ? element.textContent.trim() : '';
    if (text) {
      return text;
    }
  }

  if (list.dataset.listName) {
    return list.dataset.listName.trim();
  }

  if (typeof list.getAttribute === 'function') {
    const label = list.getAttribute('aria-label');
    if (label) {
      return label.trim();
    }
  }

  return '';
}

function normalizeColumns(columnsText) {
  if (!columnsText || typeof columnsText !== 'string') {
    return [];
  }

  return columnsText
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean)
    .map((column) => column.toUpperCase());
}

function resetLegacyStyles(list) {
  list.style.removeProperty('background-color');
  list.style.removeProperty('border-radius');
  list.style.removeProperty('width');
  list.style.removeProperty('display');

  const legacyContent = list.querySelector('.js-list-content');
  if (legacyContent) {
    legacyContent.style.removeProperty('display');
  }
}

function toggleListVisibility(list, shouldShow) {
  if (shouldShow) {
    list.classList.remove(HIDDEN_CLASS);
    resetLegacyStyles(list);
    return;
  }

  list.classList.add(HIDDEN_CLASS);

  const legacyContent = list.querySelector('.js-list-content');
  if (legacyContent) {
    legacyContent.style.display = 'none';
  }
}

function sendBadgeUpdate(isFiltered) {
  if (lastBadgeFilteredState === isFiltered) {
    return;
  }

  lastBadgeFilteredState = isFiltered;

  try {
    chrome.runtime.sendMessage({
      type: 'trelloViews:updateBadge',
      isFiltered
    });
  } catch (err) {
    // Ignore errors when the runtime is unavailable (e.g., extension reloading).
    console.warn('Trello Views: Failed to send badge update.', err);
  }
}

function applyCurrentSelection() {
  ensureStyles();

  const lists = getBoardLists();
  if (!lists.length) {
    return;
  }

  const normalizedColumns = normalizeColumns(currentSelection.activeColumns);
  const showAll = Boolean(currentSelection.allColumns) || normalizedColumns.length === 0;

  lists.forEach((list) => {
    const listTitle = extractListTitle(list).toUpperCase();
    const matchesFilter = showAll || (listTitle && normalizedColumns.includes(listTitle));
    toggleListVisibility(list, matchesFilter || !listTitle);
  });

  sendBadgeUpdate(!showAll);
}

function scheduleApplyCurrentSelection() {
  if (pendingMutationApply) {
    return;
  }

  pendingMutationApply = true;
  requestAnimationFrame(() => {
    pendingMutationApply = false;
    applyCurrentSelection();
  });
}

function persistSelection() {
  if (!currentBoardKey) {
    return;
  }

  const storageKey = `${STORAGE_PREFIX}${currentBoardKey}`;
  const payload = {};
  payload[storageKey] = currentSelection;
  chrome.storage.local.set(payload);
}

function setSelection(selection, { persist = true } = {}) {
  if (!selection) {
    currentSelection = { allColumns: true, activeColumns: '' };
  } else {
    currentSelection = {
      allColumns: Boolean(selection.allColumns),
      activeColumns: typeof selection.activeColumns === 'string' ? selection.activeColumns : ''
    };
  }

  applyCurrentSelection();

  if (persist) {
    persistSelection();
  } else {
    const normalizedColumns = normalizeColumns(currentSelection.activeColumns);
    const showAll = Boolean(currentSelection.allColumns) || normalizedColumns.length === 0;
    sendBadgeUpdate(!showAll);
  }
}

function loadSelectionForCurrentBoard() {
  if (!currentBoardKey) {
    setSelection(null, { persist: false });
    return;
  }

  const storageKey = `${STORAGE_PREFIX}${currentBoardKey}`;
  chrome.storage.local.get(storageKey, (result) => {
    const stored = result[storageKey];
    if (stored && typeof stored === 'object') {
      setSelection(stored, { persist: false });
    } else {
      setSelection(null, { persist: false });
    }
  });
}

function handleLocationChange() {
  const newBoardKey = getBoardKeyFromLocation();
  if (newBoardKey === currentBoardKey) {
    return;
  }

  currentBoardKey = newBoardKey;
  lastBadgeFilteredState = null;
  loadSelectionForCurrentBoard();
}

function startLocationWatcher() {
  if (locationWatcherId !== null) {
    return;
  }

  locationWatcherId = window.setInterval(() => {
    if (window.location.href !== lastKnownHref) {
      lastKnownHref = window.location.href;
      handleLocationChange();
      scheduleApplyCurrentSelection();
    }
  }, 1000);
}

function startMutationObserver() {
  if (mutationObserver || !document.body) {
    return;
  }

  mutationObserver = new MutationObserver(scheduleApplyCurrentSelection);
  mutationObserver.observe(document.body, { childList: true, subtree: true });
}

chrome.runtime.onMessage.addListener((request) => {
  if (!request || typeof request !== 'object') {
    return;
  }

  if (!('allColumns' in request) || !('activeColumns' in request)) {
    return;
  }

  handleLocationChange();

  setSelection({
    allColumns: Boolean(request.allColumns),
    activeColumns: typeof request.activeColumns === 'string' ? request.activeColumns : ''
  });
});

function init() {
  handleLocationChange();
  startMutationObserver();
  startLocationWatcher();
  scheduleApplyCurrentSelection();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
