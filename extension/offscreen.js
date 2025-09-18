// offscreen.js - Handles clipboard operations in offscreen document

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'copyToClipboard') {
    try {
      await navigator.clipboard.writeText(message.text);
      // Try to send success message, but don't throw if service worker is inactive
      chrome.runtime.sendMessage({ action: 'clipboardSuccess' }).catch(() => {});
    } catch (error) {
      chrome.runtime.sendMessage({
        action: 'clipboardError',
        error: error.message
      }).catch(() => {});
    }
  }
});
