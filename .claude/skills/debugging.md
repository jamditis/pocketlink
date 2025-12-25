# Extension Debugging Guide

## Activation
Use when: troubleshooting issues, investigating user bug reports, or diagnosing unexpected behavior.

## Mental Model

Extension debugging requires inspecting **multiple isolated contexts**. Each context has its own console and scope:

```
┌─────────────────────────────────────────────────────────────┐
│ Service Worker (background.js)                              │
│ Console: chrome://extensions → Service worker link          │
│ Scope: Chrome APIs, no DOM                                  │
├─────────────────────────────────────────────────────────────┤
│ Popup (popup.html/js)                                       │
│ Console: Right-click popup → Inspect                        │
│ Scope: DOM + Chrome APIs (limited)                          │
├─────────────────────────────────────────────────────────────┤
│ Options (options.html/js)                                   │
│ Console: Right-click page → Inspect                         │
│ Scope: DOM + Chrome APIs (limited)                          │
├─────────────────────────────────────────────────────────────┤
│ Offscreen (offscreen.html/js)                               │
│ Console: chrome://extensions → Details → offscreen.html     │
│ Scope: DOM (limited) + clipboard access                     │
├─────────────────────────────────────────────────────────────┤
│ Content Script (if any)                                     │
│ Console: Page DevTools → Sources → Content scripts          │
│ Scope: Page DOM + limited Chrome APIs                       │
└─────────────────────────────────────────────────────────────┘
```

## Quick Diagnostics

### Check Extension State

```javascript
// In service worker console:

// 1. Check storage
chrome.storage.sync.get(null).then(console.log);
// Expected: { bitlyToken: "...", interactionMode: "...", ... }

// 2. Check offscreen document status
chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] }).then(console.log);
// Expected: [] (none) or [{ contextType: 'OFFSCREEN_DOCUMENT', ... }]

// 3. Check context menu exists
chrome.contextMenus.getAll?.(console.log);
// Note: getAll may not exist in all versions

// 4. Check for errors
chrome.runtime.lastError && console.log(chrome.runtime.lastError);
```

### Common Issues & Solutions

**Issue: Context menu not appearing**
```
Causes:
1. Extension not installed correctly
2. onInstalled handler failed
3. Context menu create() failed silently

Debug:
1. Check chrome://extensions for errors
2. Reload extension
3. Check service worker console for create() errors

Fix:
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'createShortlink',
    title: 'Create shortlink with PocketLink',
    contexts: ['page']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Menu create failed:', chrome.runtime.lastError);
    }
  });
});
```

**Issue: Clipboard copy fails silently**
```
Causes:
1. Page has restrictive CSP
2. User denied clipboard permission
3. Offscreen document not created
4. Wrong interaction mode for context

Debug steps:
1. Check which mode is active:
   chrome.storage.sync.get('interactionMode').then(console.log)

2. For offscreen mode - check document exists:
   chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })

3. For injection mode - check page console for errors

4. Test on known-good page (e.g., example.com)

Fix: Enable fallback mode in options
```

**Issue: "Please set your Bitly API key" despite key being set**
```
Causes:
1. Storage sync delay on first install
2. Token saved to wrong storage area
3. Token retrieval race condition

Debug:
chrome.storage.sync.get('bitlyToken').then(({ bitlyToken }) => {
  console.log('Token exists:', !!bitlyToken);
  console.log('Token length:', bitlyToken?.length);
});

Fix: Ensure token saved to sync, not local:
await chrome.storage.sync.set({ bitlyToken: token });
```

**Issue: Shortlink created but not copied**
```
Causes:
1. Clipboard operation failed
2. Notification disabled, no feedback
3. Popup opened but user didn't see it

Debug:
1. Check service worker console for errors after right-click
2. Check if popup window opened (look for new small window)
3. Verify notification setting:
   chrome.storage.sync.get('showNotifications').then(console.log)

Fix: Test each clipboard mode independently
```

**Issue: "Error creating shortlink" notification**
```
Causes:
1. Invalid or expired API token
2. Network connectivity issue
3. Bit.ly API down
4. Rate limit exceeded

Debug:
// Test API directly in service worker console:
const { bitlyToken } = await chrome.storage.sync.get('bitlyToken');
const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${bitlyToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ long_url: 'https://example.com' })
});
console.log('Status:', response.status);
console.log('Body:', await response.json());
```

## Chrome DevTools Techniques

### Breakpoints in Service Worker
```
1. chrome://extensions → Details → Service worker
2. Click "Inspect views: service worker"
3. Sources tab → background.js
4. Set breakpoint on contextMenus.onClicked handler
5. Right-click on a page to trigger
```

### Network Inspection
```
1. Open service worker DevTools
2. Network tab
3. Right-click to create shortlink
4. Look for request to api-ssl.bitly.com
5. Check request headers, body, response
```

### Storage Inspection
```
1. Open service worker DevTools
2. Application tab → Storage → Chrome Storage
3. View sync and local storage contents
4. Can edit values for testing
```

## Logging Strategy

**Current logging (background.js):**
```javascript
// Errors logged to console
console.error('Error creating shortlink:', error);

// Success path has minimal logging
console.log('Shortlink created successfully');
```

**Enhanced logging for debugging:**
```javascript
const DEBUG = true;

function log(level, message, data) {
  if (!DEBUG && level === 'debug') return;

  const timestamp = new Date().toISOString();
  console[level](`[PocketLink ${timestamp}]`, message, data || '');
}

// Usage
log('debug', 'Starting shortlink creation', { url, mode: settings.interactionMode });
log('error', 'API call failed', { status: response.status, body: await response.text() });
```

## User Bug Report Template

When users report issues, gather:

```
1. Chrome version: chrome://version
2. Extension version: chrome://extensions
3. Interaction mode: Options page setting
4. Steps to reproduce:
   - What page were you on?
   - What did you click?
   - What happened vs what you expected?
5. Console errors:
   - Service worker console
   - Page console (if relevant)
6. Does it happen on all pages or specific ones?
7. Did it ever work before?
```

## Version: 1.0.0
## References: extension/background.js, docs/FAQ.md
