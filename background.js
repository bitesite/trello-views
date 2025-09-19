const BADGE_ACTIVE_TEXT = 'ON';
const BADGE_INACTIVE_TEXT = '';
const BADGE_COLOR = '#0052cc';

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
});

function setBadge(tabId, isFiltered) {
  if (typeof tabId !== 'number') {
    return;
  }

  chrome.action.setBadgeText({ tabId, text: isFiltered ? BADGE_ACTIVE_TEXT : BADGE_INACTIVE_TEXT });
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (!message || message.type !== 'trelloViews:updateBadge') {
    return;
  }

  const tabId = sender?.tab?.id;
  setBadge(tabId, Boolean(message.isFiltered));
});
