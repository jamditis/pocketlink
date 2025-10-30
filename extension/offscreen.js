// offscreen.js - Handles clipboard operations in offscreen document

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'copyToClipboard') {
    (async () => {
      try {
        await navigator.clipboard.writeText(message.text);
        sendResponse({ success: true });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true;
  }
});
