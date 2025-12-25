# Feature Implementation Guide

## Activation
Use when: adding new features, extending functionality, implementing user-requested enhancements, or following the PRD feature roadmap.

## Mental Model

New features in PocketLink follow a **layered implementation pattern**:

```
1. Storage Schema  → Define how feature data persists
2. Background Logic → Implement core functionality in service worker
3. UI Integration  → Add options/popup controls if needed
4. User Feedback   → Notifications, status indicators
5. Documentation   → Update PRD, FAQ, README
```

Every feature should answer:
- Where does the data live? (storage.sync vs storage.local)
- What triggers the feature? (context menu, options change, automatic)
- How does the user know it worked? (notification, popup, visual change)

## Feature Implementation Template

### Step 1: Define Storage Schema

```javascript
// Add to storage schema (document in code comment)
// chrome.storage.sync - User preferences
{
  bitlyToken: "string",
  interactionMode: "offscreen|injection|popup",
  showNotifications: boolean,
  fallbackMode: boolean,
  // NEW FEATURE: Link history
  enableHistory: boolean,  // ← New setting
}

// chrome.storage.local - Runtime data
{
  currentShortlink: "string",
  // NEW FEATURE: Recent links
  recentLinks: [{ longUrl, shortUrl, timestamp }],  // ← New data
}
```

### Step 2: Implement Background Logic

**Pattern: Feature flag check**
```javascript
// background.js - Add feature logic
async function handleShortlink(shortUrl, longUrl, settings, tab) {
  // Existing clipboard logic...

  // NEW: Save to history if enabled
  if (settings.enableHistory) {
    await saveToHistory(longUrl, shortUrl);
  }
}

async function saveToHistory(longUrl, shortUrl) {
  const { recentLinks = [] } = await chrome.storage.local.get('recentLinks');
  const updated = [
    { longUrl, shortUrl, timestamp: Date.now() },
    ...recentLinks.slice(0, 49)  // Keep last 50
  ];
  await chrome.storage.local.set({ recentLinks: updated });
}
```

### Step 3: Add UI Controls

**Options page (options.html):**
```html
<!-- Add to settings form -->
<div class="setting-group">
  <label>
    <input type="checkbox" id="enableHistory" />
    Keep history of created links
  </label>
</div>
```

**Options script (options.js):**
```javascript
// Load setting
const { enableHistory } = await chrome.storage.sync.get('enableHistory');
document.getElementById('enableHistory').checked = enableHistory ?? true;

// Save setting
document.getElementById('enableHistory').addEventListener('change', async (e) => {
  await chrome.storage.sync.set({ enableHistory: e.target.checked });
});
```

### Step 4: User Feedback

```javascript
// Notify user of feature activation
if (settings.enableHistory) {
  console.log('Link saved to history');
  // Or update popup UI to show history count
}
```

### Step 5: Documentation Updates

**Update these files:**
- `docs/PRD.md` - Add feature to requirements
- `docs/FAQ.md` - Add user questions about feature
- `README.md` - Update features list

## Planned Features (from PRD)

### High Priority

**1. Link History Dashboard**
```
Storage: chrome.storage.local.recentLinks[]
Trigger: Automatic on shortlink creation
UI: New section in popup or dedicated history page
```

**2. Custom Domain Support (Bit.ly Pro)**
```
Storage: chrome.storage.sync.customDomain
Trigger: User sets domain in options
API Change: Add "domain" field to shorten request
```

**3. QR Code Generation**
```
Storage: None (generated on demand)
Trigger: Button in popup
Implementation: Canvas API or QR library
```

### Medium Priority

**4. Bulk Link Shortening**
```
Context: "Shorten all links on page" menu item
Implementation: Content script to find links, batch API calls
UI: Results popup with list
```

**5. Link Analytics**
```
API: GET /v4/bitlinks/{bitlink}/clicks
Storage: Cache in local storage
UI: Click count in popup or history
```

## Code Locations

**Where to add feature code:**

| Feature Type | Primary File | Secondary Files |
|-------------|--------------|-----------------|
| New setting | options.js, options.html | background.js (read setting) |
| New API call | background.js | - |
| New UI element | popup.html, popup.js | options.html (if configurable) |
| New storage | background.js | All files that read it |
| New permission | manifest.json | background.js (use API) |

## Permission Guidelines

**Only add permissions when absolutely necessary:**

| Permission | When Needed |
|-----------|-------------|
| `tabs` | Need tab URL beyond context menu |
| `history` | Accessing browser history |
| `bookmarks` | Creating/reading bookmarks |
| `<all_urls>` | Content script on all pages (avoid!) |

**Current minimal permissions:**
```json
"permissions": [
  "contextMenus",
  "activeTab",
  "storage",
  "notifications",
  "scripting",
  "offscreen"
]
```

## Testing New Features

**Before committing:**
1. Test with feature enabled AND disabled
2. Test with fresh install (no existing storage)
3. Test upgrade path (existing users)
4. Test error cases (API failure, permission denied)
5. Verify no console errors

**Test matrix:**
```
[ ] Chrome stable
[ ] Chrome beta (upcoming API changes)
[ ] Edge (Chromium)
[ ] Brave (privacy features may interfere)
```

## Anti-Patterns

❌ **Adding features without options**
```javascript
// BAD: Always runs, no user control
await saveToHistory(longUrl, shortUrl);

// GOOD: User can disable
if (settings.enableHistory) {
  await saveToHistory(longUrl, shortUrl);
}
```

❌ **Unbounded storage growth**
```javascript
// BAD: Never cleans up
recentLinks.push(newLink);

// GOOD: Bounded list
const updated = [newLink, ...recentLinks.slice(0, 49)];
```

❌ **Blocking operations in event handlers**
```javascript
// BAD: Slow operation blocks context menu
chrome.contextMenus.onClicked.addListener(async () => {
  await slowOperation();  // User waits
});

// GOOD: Non-blocking feedback first
chrome.contextMenus.onClicked.addListener(async () => {
  notify('Creating shortlink...');
  await slowOperation();
  notify('Done!');
});
```

## Version: 1.0.0
## References: docs/PRD.md, extension/background.js, extension/options.js
