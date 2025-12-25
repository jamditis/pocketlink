# Code Review Checklist

## Activation
Use when: reviewing pull requests, auditing code changes, or validating implementations before merge.

## Mental Model

Code review for PocketLink focuses on **security, reliability, and user experience**. The extension handles sensitive data (API tokens) and must work reliably across different page contexts.

**Review priorities (in order):**
1. Security vulnerabilities
2. Chrome Web Store compliance
3. Error handling completeness
4. User experience impact
5. Code quality and maintainability

## Security Checklist

### Token Handling
```
□ API tokens NEVER logged to console
□ Tokens stored ONLY in chrome.storage.sync
□ No tokens in URL parameters or POST bodies (except auth header)
□ Token not exposed to content scripts
```

### Permission Scope
```
□ No new permissions unless justified
□ host_permissions minimal (only api-ssl.bitly.com)
□ activeTab preferred over broad tab access
□ No <all_urls> unless absolutely necessary
```

### Content Security
```
□ No eval() or new Function()
□ No innerHTML with user input
□ No external script loading
□ No dynamic import() from untrusted sources
```

**Red flags in code:**
```javascript
// ❌ REJECT: Token exposure
console.log('Token:', bitlyToken);

// ❌ REJECT: XSS vulnerability
element.innerHTML = userInput;

// ❌ REJECT: Remote code execution
eval(responseData);
```

## Chrome Web Store Compliance

### Required Checks
```
□ No remote code (CDN scripts, external CSS)
□ System fonts only (no Google Fonts links)
□ All styles inline or bundled
□ No obfuscated/minified code without source
□ Clear permission justifications
```

### Manifest Validation
```javascript
// Verify permissions match actual usage
"permissions": [
  "contextMenus",  // ✓ Used for right-click menu
  "activeTab",     // ✓ Used for clipboard injection
  "storage",       // ✓ Used for settings persistence
  "notifications", // ✓ Used for user feedback
  "scripting",     // ✓ Used for clipboard fallback
  "offscreen"      // ✓ Used for secure clipboard
],
"host_permissions": [
  "https://api-ssl.bitly.com/"  // ✓ Only Bitly API
]
```

## Error Handling Review

### Required Error Handling
```
□ API calls wrapped in try/catch
□ Storage operations have error handling
□ Network failures show user-friendly messages
□ Clipboard failures trigger fallback
□ Invalid token triggers setup prompt
```

### Error Message Quality
```javascript
// ❌ BAD: Unhelpful
catch (error) {
  notify('Error');
}

// ✓ GOOD: Actionable
catch (error) {
  if (error.message.includes('401')) {
    notify('Invalid API token. Check your settings.');
  } else if (error.name === 'TypeError') {
    notify('Network error. Check your connection.');
  } else {
    notify('Error creating shortlink. Please try again.');
  }
}
```

## Async Patterns Review

### Service Worker Patterns
```
□ No reliance on global state between events
□ Storage read at event time, not module load
□ Offscreen document lifecycle managed correctly
□ Message handlers return true for async responses
```

```javascript
// ❌ REJECT: Stale state
let cachedSettings = null;
chrome.contextMenus.onClicked.addListener(() => {
  useSettings(cachedSettings);  // May be outdated
});

// ✓ ACCEPT: Fresh state
chrome.contextMenus.onClicked.addListener(async () => {
  const settings = await chrome.storage.sync.get();
  useSettings(settings);
});
```

### Message Passing
```javascript
// ❌ REJECT: Missing return true
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  doAsync().then(sendResponse);
  // Missing return true!
});

// ✓ ACCEPT: Proper async handling
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  doAsync().then(sendResponse);
  return true;  // Keep channel open
});
```

## UI/UX Review

### Accessibility
```
□ Form inputs have labels
□ Buttons have descriptive text
□ Color contrast sufficient
□ Focus states visible
□ Keyboard navigation works
```

### User Feedback
```
□ Success states acknowledged
□ Error states explained
□ Loading states indicated (for slow operations)
□ Settings changes confirmed
```

## Code Quality

### Naming Conventions
```javascript
// ✓ GOOD: Clear, descriptive names
const bitlyToken = settings.bitlyToken;
async function createShortlink(url, token) { }
const isOffscreenSupported = typeof chrome.offscreen !== 'undefined';

// ❌ BAD: Unclear names
const t = settings.t;
async function cs(u, t) { }
const flag = true;
```

### Magic Values
```javascript
// ❌ REJECT: Magic strings scattered
if (settings.mode === 'offscreen') { }
chrome.storage.sync.get('bitlyToken');

// ✓ ACCEPT: Constants defined
const MODES = { OFFSCREEN: 'offscreen', INJECTION: 'injection', POPUP: 'popup' };
const STORAGE_KEYS = { TOKEN: 'bitlyToken' };
if (settings.mode === MODES.OFFSCREEN) { }
```

### Comment Quality
```javascript
// ❌ REJECT: Obvious comments
// Loop through items
for (const item of items) { }

// ✓ ACCEPT: Explains why, not what
// Offscreen documents can become orphaned if service worker restarts
// Check for existing contexts before creating new one
const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
```

## Review Process

1. **Read the diff completely** before making comments
2. **Run the code** - load extension and test the change
3. **Check all modes** - offscreen, injection, popup
4. **Test error paths** - invalid token, network failure
5. **Verify documentation** - updated if behavior changed

## Version: 1.0.0
## References: CONTRIBUTING.md, extension/background.js
