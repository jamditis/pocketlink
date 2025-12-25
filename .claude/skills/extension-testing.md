# Extension Testing Strategies

## Activation
Use when: adding tests, validating changes, debugging issues, or setting up test infrastructure.

## Mental Model

Browser extensions are **hard to test automatically** because they depend on Chrome APIs that don't exist in Node.js. The strategy is:
1. **Isolate pure logic** - Functions that don't touch Chrome APIs
2. **Mock Chrome APIs** - Create fake implementations for testing
3. **Integration test manually** - Real browser testing for API interactions

**Testing pyramid for extensions:**
```
         /\
        /  \  Manual/E2E (Real Chrome)
       /----\
      /      \ Integration (Mocked Chrome APIs)
     /--------\
    /          \ Unit (Pure Functions)
   --------------
```

## Current State (PocketLink)

**Gap identified:** No automated tests exist. All testing is manual.

**High-value test targets:**
- `createShortlink()` - API call logic
- Storage operations - Settings persistence
- Error handling paths - Failure scenarios
- Mode selection logic - Offscreen vs injection vs popup

## Recommended Test Setup

**Install dependencies:**
```bash
npm init -y
npm install --save-dev jest @types/chrome sinon-chrome
```

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setup.js'],
  testMatch: ['**/test/**/*.test.js']
};
```

**test/setup.js:**
```javascript
const chrome = require('sinon-chrome');
global.chrome = chrome;

// Reset mocks between tests
beforeEach(() => {
  chrome.flush();
});
```

## Unit Test Examples

**Testing API call logic:**
```javascript
// test/createShortlink.test.js
const { createShortlink } = require('../extension/background');

describe('createShortlink', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('returns shortlink on success', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ link: 'https://bit.ly/abc123' })
    });

    const result = await createShortlink('https://example.com', 'token123');
    expect(result).toBe('https://bit.ly/abc123');
  });

  it('throws on API error', async () => {
    fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'INVALID_ARG_LONG_URL' })
    });

    await expect(createShortlink('bad-url', 'token123'))
      .rejects.toThrow('INVALID_ARG_LONG_URL');
  });

  it('throws on network error', async () => {
    fetch.mockRejectedValue(new TypeError('Network error'));

    await expect(createShortlink('https://example.com', 'token123'))
      .rejects.toThrow('Network error');
  });
});
```

**Testing storage operations:**
```javascript
// test/storage.test.js
describe('settings storage', () => {
  it('saves settings to sync storage', async () => {
    chrome.storage.sync.set.yields();

    await saveSettings({ interactionMode: 'popup' });

    expect(chrome.storage.sync.set.calledWith({
      interactionMode: 'popup'
    })).toBe(true);
  });

  it('retrieves settings with defaults', async () => {
    chrome.storage.sync.get.yields({ interactionMode: 'offscreen' });

    const settings = await getSettings();

    expect(settings.interactionMode).toBe('offscreen');
    expect(settings.showNotifications).toBe(true); // default
  });
});
```

## Integration Test Patterns

**Testing message passing:**
```javascript
describe('offscreen communication', () => {
  it('sends clipboard message correctly', async () => {
    chrome.runtime.sendMessage.yields({ success: true });

    await copyViaOffscreen('https://bit.ly/abc');

    expect(chrome.runtime.sendMessage.calledWith({
      action: 'copyToClipboard',
      text: 'https://bit.ly/abc'
    })).toBe(true);
  });
});
```

**Testing context menu creation:**
```javascript
describe('context menu', () => {
  it('creates menu item on install', () => {
    // Trigger install event
    chrome.runtime.onInstalled.dispatch({ reason: 'install' });

    expect(chrome.contextMenus.create.calledWith({
      id: 'createShortlink',
      title: 'Create shortlink with PocketLink',
      contexts: ['page']
    })).toBe(true);
  });
});
```

## Manual Testing Checklist

**Before each release, test:**

1. **Fresh install**
   - [ ] Welcome page appears
   - [ ] Options page accessible
   - [ ] Token saves correctly

2. **Context menu**
   - [ ] Menu item visible on right-click
   - [ ] Works on regular pages
   - [ ] Shows error on chrome:// pages

3. **Each interaction mode**
   - [ ] Offscreen: Copies without popup
   - [ ] Injection: Copies without popup
   - [ ] Popup: Window opens, copy button works

4. **Error handling**
   - [ ] Invalid token shows helpful message
   - [ ] Network error shows notification
   - [ ] Fallback activates when primary fails

5. **Settings persistence**
   - [ ] Settings survive browser restart
   - [ ] Settings sync across devices (if signed in)

## E2E Testing with Playwright

**For comprehensive automated testing:**
```javascript
// test/e2e/extension.spec.js
const { test, chromium } = require('@playwright/test');

test('extension creates shortlink', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  const page = await context.newPage();

  // Open options, set token
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.fill('#token', process.env.TEST_BITLY_TOKEN);
  await page.click('#save');

  // Navigate to test page
  await page.goto('https://example.com');

  // Right-click and select menu item (complex - needs CDP)
  // ...

  await context.close();
});
```

## Code Coverage

**Add coverage reporting:**
```json
{
  "scripts": {
    "test": "jest --coverage"
  },
  "jest": {
    "collectCoverageFrom": [
      "extension/**/*.js",
      "!extension/offscreen.js"
    ]
  }
}
```

## Version: 1.0.0
## References: extension/background.js, docs/TRD.md
