# Browser Extension Development (Manifest V3)

## Activation
Use when: developing Chrome extension features, modifying background scripts, working with service workers, updating manifest permissions, or debugging extension behavior.

## Mental Model

A Manifest V3 extension is a **reactive state machine**. The service worker sleeps until events wake it, executes handlers, then sleeps again. Never assume persistent state between events.

```
Event (click/message/alarm) → Wake Service Worker → Handle → Sleep
```

**Core architecture layers:**
```
┌─────────────────────────────────────────┐
│ Chrome APIs (storage, tabs, messaging)  │ ← Platform
├─────────────────────────────────────────┤
│ Service Worker (background.js)          │ ← Orchestration
├─────────────────────────────────────────┤
│ Content Scripts / Offscreen Documents   │ ← Page Context
├─────────────────────────────────────────┤
│ UI (popup, options, sidebar)            │ ← User Interaction
└─────────────────────────────────────────┘
```

## PocketLink Architecture

**Key files:**
- `extension/background.js` - Service worker, handles context menu clicks, API calls, clipboard routing
- `extension/manifest.json` - Permissions, host permissions, script registration
- `extension/offscreen.js` - Isolated clipboard operations (Chrome 109+)
- `extension/popup.js` - Fallback UI with copy button
- `extension/options.js` - Settings persistence

**Three interaction modes (defined in background.js:65-150):**
1. **Offscreen** - Most secure, uses offscreen document for clipboard
2. **Injection** - Executes script in active tab context
3. **Popup** - Opens window for manual copy

## Patterns to Follow

### Service Worker Event Handling
```javascript
// Always use async handlers
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Retrieve fresh state - don't rely on global variables
  const settings = await chrome.storage.sync.get(['bitlyToken', 'interactionMode']);
  // Handle the event
});
```

### Chrome Storage Best Practices
```javascript
// Sync storage for cross-device settings (5MB limit, ~100KB per item)
await chrome.storage.sync.set({ bitlyToken: token });

// Local storage for temporary data (5MB limit)
await chrome.storage.local.set({ currentShortlink: url });

// Always handle storage errors
try {
  await chrome.storage.sync.set(data);
} catch (error) {
  console.error('Storage failed:', error);
}
```

### Offscreen Document Lifecycle
```javascript
// Check existing contexts before creating
async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Copy shortlink to clipboard'
    });
  }
}
```

### Message Passing
```javascript
// Background → Offscreen
chrome.runtime.sendMessage({ action: 'copyToClipboard', text: shortUrl });

// Offscreen listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'copyToClipboard') {
    navigator.clipboard.writeText(message.text)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});
```

## Chrome Web Store Compliance

**Required:**
- No remote code (CDN scripts, external stylesheets)
- System fonts only (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`)
- Inline styles or bundled CSS
- Minimal permissions (request only what's needed)
- Clear privacy policy for any data handling

**This extension's permissions:**
- `contextMenus` - Right-click menu
- `activeTab` - Current tab access on user action
- `storage` - Settings persistence
- `notifications` - User feedback
- `scripting` - Clipboard injection fallback
- `offscreen` - Secure clipboard access

## Anti-Patterns

❌ **Don't assume service worker state persists**
```javascript
// BAD: Global variable that resets on wake
let cachedToken = null;

// GOOD: Always fetch from storage
const { bitlyToken } = await chrome.storage.sync.get('bitlyToken');
```

❌ **Don't block the main thread**
```javascript
// BAD: Synchronous operations
const result = heavyComputation();

// GOOD: Use async/await, break up work
const result = await chrome.storage.sync.get('key');
```

❌ **Don't create duplicate offscreen documents**
```javascript
// BAD: Creating without checking
await chrome.offscreen.createDocument(/* ... */);

// GOOD: Check first (see pattern above)
await ensureOffscreenDocument();
```

## Debugging Tips

1. **Service worker console**: `chrome://extensions` → Details → Service worker link
2. **Storage inspection**: `chrome.storage.sync.get(null).then(console.log)`
3. **Offscreen document**: Check for existing contexts with `chrome.runtime.getContexts()`
4. **Permissions testing**: Test on `chrome://` pages (will fail - expected)

## Version: 1.0.0
## References: docs/TRD.md, extension/background.js
