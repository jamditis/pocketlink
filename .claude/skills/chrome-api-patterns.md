# Chrome Extension API Patterns

## Activation
Use when: implementing clipboard operations, managing storage, handling context menus, showing notifications, or coordinating between extension contexts.

## Mental Model

Chrome APIs are **permission-gated async interfaces**. Every API call should:
1. Verify the permission exists in manifest
2. Handle async properly (Promises, not callbacks in MV3)
3. Expect and handle failures gracefully

## Clipboard Operations (The Hard Problem)

Clipboard access in extensions is notoriously complex because different contexts have different capabilities.

**Context capabilities:**
| Context | `navigator.clipboard` | `document.execCommand` | Notes |
|---------|----------------------|------------------------|-------|
| Popup | ✅ Yes | ✅ Yes | Most permissive |
| Options | ✅ Yes | ✅ Yes | User-initiated |
| Content Script | ⚠️ Limited | ⚠️ Limited | Depends on page CSP |
| Offscreen | ✅ Yes | ❌ No | Chrome 109+ |
| Service Worker | ❌ No DOM | ❌ No DOM | Cannot directly access |

**PocketLink's three-mode solution (background.js:95-150):**

```javascript
// Mode 1: Offscreen (recommended)
async function copyViaOffscreen(text) {
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    action: 'copyToClipboard',
    text: text
  });
  return response.success;
}

// Mode 2: Injection (fallback)
async function copyViaInjection(text, tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (textToCopy) => navigator.clipboard.writeText(textToCopy),
    args: [text]
  });
}

// Mode 3: Popup (universal fallback)
function copyViaPopup(text) {
  chrome.storage.local.set({ currentShortlink: text });
  chrome.windows.create({
    url: 'popup.html',
    type: 'popup',
    width: 400,
    height: 200
  });
}
```

## Storage Patterns

**Sync vs Local:**
- `chrome.storage.sync` - User preferences, syncs across devices, 100KB limit per item
- `chrome.storage.local` - Temporary data, larger capacity (5MB), device-local

**Pattern: Settings with defaults**
```javascript
const DEFAULTS = {
  interactionMode: 'offscreen',
  showNotifications: true,
  fallbackMode: true
};

async function getSettings() {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULTS));
  return { ...DEFAULTS, ...stored };
}
```

**Pattern: Atomic updates**
```javascript
// Read-modify-write atomically
async function incrementCounter() {
  const { counter = 0 } = await chrome.storage.local.get('counter');
  await chrome.storage.local.set({ counter: counter + 1 });
  return counter + 1;
}
```

## Context Menu Patterns

**Create menu on install:**
```javascript
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'createShortlink',
    title: 'Create shortlink with PocketLink',
    contexts: ['page', 'link', 'selection']
  });
});
```

**Handle clicks with URL extraction:**
```javascript
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Priority: link URL > page URL
  const targetUrl = info.linkUrl || info.pageUrl || tab.url;
  await processUrl(targetUrl);
});
```

## Notification Patterns

**Show notification with auto-dismiss:**
```javascript
function notify(title, message, isError = false) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: isError ? 2 : 0
  });
}
```

**Respect user preferences:**
```javascript
async function notifyIfEnabled(title, message) {
  const { showNotifications } = await chrome.storage.sync.get('showNotifications');
  if (showNotifications !== false) {
    notify(title, message);
  }
}
```

## Message Passing Patterns

**Request-response pattern:**
```javascript
// Sender (background.js)
const response = await chrome.runtime.sendMessage({
  action: 'copyToClipboard',
  text: shortUrl
});

// Receiver (offscreen.js)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'copyToClipboard') {
    handleCopy(message.text)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // CRITICAL: Keeps channel open for async
  }
});
```

## Error Handling

**API errors have specific patterns:**
```javascript
try {
  await chrome.storage.sync.set({ key: value });
} catch (error) {
  if (error.message.includes('QUOTA_BYTES')) {
    // Storage quota exceeded
  } else if (error.message.includes('MAX_ITEMS')) {
    // Too many items
  }
}
```

**Permission errors:**
```javascript
// Check if permission is available before using
if (chrome.offscreen) {
  // Offscreen API available (Chrome 109+)
} else {
  // Fall back to injection mode
}
```

## Anti-Patterns

❌ **Forgetting `return true` in async message handlers**
```javascript
// BAD: Response never sent
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  doAsyncWork().then(result => sendResponse(result));
  // Missing return true!
});
```

❌ **Not checking API availability**
```javascript
// BAD: Crashes on older Chrome
await chrome.offscreen.createDocument(/* ... */);

// GOOD: Feature detection
if (typeof chrome.offscreen !== 'undefined') {
  await chrome.offscreen.createDocument(/* ... */);
}
```

## Version: 1.0.0
## References: extension/background.js, extension/offscreen.js
