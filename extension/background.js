/**
 * @fileoverview PocketLink Background Service Worker
 *
 * This module implements the core functionality for the PocketLink Chrome extension,
 * which creates shortened URLs using the Bitly API and copies them to the clipboard.
 *
 * ## Architecture Overview
 *
 * The extension operates as a Manifest V3 service worker with three clipboard modes:
 *
 * 1. **Offscreen Mode** (default, Chrome 109+): Uses an offscreen document to access
 *    the Clipboard API without requiring user interaction. Most reliable for background
 *    clipboard operations.
 *
 * 2. **Injection Mode**: Injects a script into the active tab to use the page's
 *    clipboard context. Works on most pages but may fail on restricted pages
 *    (chrome://, file://, etc.).
 *
 * 3. **Popup Mode**: Opens a popup window displaying the shortened URL with a
 *    manual copy button. Used as fallback when other modes fail.
 *
 * ## Chrome API Dependencies
 *
 * - `chrome.contextMenus` - Right-click menu integration
 * - `chrome.storage.sync` - Persistent settings storage (synced across devices)
 * - `chrome.storage.local` - Temporary data storage (popup shortlink)
 * - `chrome.scripting` - Script injection for clipboard access
 * - `chrome.offscreen` - Offscreen document creation (Chrome 109+)
 * - `chrome.runtime` - Extension messaging and lifecycle
 * - `chrome.notifications` - User notifications
 * - `chrome.windows` - Popup window creation
 * - `chrome.tabs` - Active tab querying
 *
 * ## Message Protocol
 *
 * The service worker communicates with other extension components via chrome.runtime messages:
 *
 * ### Outbound Messages (to offscreen.js)
 * ```javascript
 * { action: 'copyToClipboard', text: string }
 * // Response: { success: boolean, error?: string }
 * ```
 *
 * ### Inbound Messages (from popup.js)
 * ```javascript
 * { action: 'createShortlinkFromPopup' }
 * // Response: { success: boolean, shortUrl?: string, error?: string }
 * ```
 *
 * @author PocketLink Contributors
 * @license MIT
 * @see {@link https://developer.chrome.com/docs/extensions/mv3/service_workers/}
 */

/**
 * @typedef {Object} PocketLinkSettings
 * @property {string} bitlyToken - Bitly API access token for authentication.
 *   Obtain from https://app.bitly.com/settings/api/
 * @property {('offscreen'|'injection'|'popup')} interactionMode - Clipboard copy method:
 *   - `'offscreen'` - Use offscreen document (Chrome 109+, most reliable)
 *   - `'injection'` - Inject script into active tab (may fail on restricted pages)
 *   - `'popup'` - Show popup window with manual copy button
 * @property {boolean} showNotifications - Whether to show desktop notifications
 *   for success/error states
 * @property {boolean} fallbackMode - If true, automatically falls back to popup
 *   mode when the primary mode fails (except when already using popup mode)
 */

/**
 * @typedef {Object} ClipboardResult
 * @property {boolean} success - Whether the clipboard operation succeeded
 * @property {string} [message] - Error message if operation failed
 */

/**
 * @typedef {Object} ShortlinkResponse
 * @property {boolean} success - Whether shortlink creation succeeded
 * @property {string} [shortUrl] - The shortened URL (present on success)
 * @property {string} [error] - Error message (present on failure)
 */

/**
 * Tracks whether an offscreen document has been created in this session.
 * Used as fallback for Chrome versions < 116 that don't support getContexts().
 *
 * @type {boolean}
 * @private
 */
let offscreenDocumentCreated = false;

/**
 * Ensures an offscreen document exists for clipboard operations.
 *
 * This function manages the lifecycle of offscreen documents, which are required
 * in Manifest V3 to access APIs like the Clipboard that need a DOM context.
 *
 * ## Chrome Version Compatibility
 *
 * The function handles multiple Chrome API versions:
 *
 * - **Chrome 116+**: Uses `chrome.runtime.getContexts()` to check for existing
 *   offscreen documents. This is the preferred method as it's reliable across
 *   service worker restarts.
 *
 * - **Chrome 109-115**: Falls back to tracking document creation via the
 *   `offscreenDocumentCreated` flag. Less reliable as the flag resets on
 *   service worker restart.
 *
 * - **Chrome < 109**: Throws an error as offscreen documents are not supported.
 *
 * ## Why This Matters
 *
 * Service workers in Manifest V3 can be terminated at any time. When restarted,
 * the `offscreenDocumentCreated` flag resets to false, but the offscreen document
 * may still exist. Attempting to create a duplicate throws an error. The
 * `getContexts()` API (Chrome 116+) solves this by querying actual document state.
 *
 * @async
 * @returns {Promise<boolean>} `true` if a new document was created,
 *   `false` if one already existed
 * @throws {Error} If offscreen documents are not supported (Chrome < 109)
 *
 * @example
 * try {
 *   const created = await ensureOffscreenDocument();
 *   console.log(created ? 'New document created' : 'Using existing document');
 * } catch (error) {
 *   console.error('Offscreen not supported:', error);
 * }
 *
 * @see {@link https://developer.chrome.com/docs/extensions/reference/offscreen/}
 * @see {@link https://developer.chrome.com/docs/extensions/reference/runtime/#method-getContexts}
 */
const ensureOffscreenDocument = async () => {
  // Check if offscreen API is available (Chrome 109+)
  if (!chrome.offscreen?.createDocument) {
    throw new Error('Offscreen documents are not supported in this browser.');
  }

  // Chrome 116+ provides getContexts() to reliably check for existing documents
  if (chrome.runtime.getContexts) {
    try {
      const contexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [chrome.runtime.getURL('offscreen.html')],
      });

      if (contexts.length > 0) {
        return false; // Document already exists, no need to create
      }
    } catch (error) {
      console.warn('Failed to query offscreen contexts, creating a new one:', error);
    }
  } else if (offscreenDocumentCreated) {
    // Fallback for Chrome 109-115: use module-level flag (less reliable)
    return false;
  }

  // Handle API version differences for the CLIPBOARD reason enum
  // Chrome 109-113 may not have Reason enum, requiring string fallback
  const clipboardReason = chrome.offscreen.Reason?.CLIPBOARD ?? 'CLIPBOARD';

  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: [clipboardReason],
    justification: 'Write shortlink to clipboard',
  });
  offscreenDocumentCreated = true;
  return true;
};

/**
 * Copies text to clipboard by injecting a script into the active tab.
 *
 * This is the "injection mode" clipboard method. It works by executing a script
 * in the context of the target tab, which gives access to the page's Clipboard API.
 *
 * ## How It Works
 *
 * 1. Uses `chrome.scripting.executeScript` to inject code into the target tab
 * 2. The injected code runs `navigator.clipboard.writeText()` in the page context
 * 3. The result is returned through the Chrome scripting API's result mechanism
 *
 * ## Result Structure
 *
 * The `executeScript` API returns an array of InjectionResults. Each result has:
 * - `result`: The return value of the injected function
 * - `frameId`: The frame where the script ran
 *
 * We destructure `[result]` to get the first (main frame) result, then access
 * `result.result` to get our `{ success, message }` object.
 *
 * ## Limitations
 *
 * This method fails on:
 * - `chrome://` pages (browser internal pages)
 * - `chrome-extension://` pages (other extensions)
 * - `file://` URLs (unless extension has file access)
 * - `about:` pages
 * - Pages with restrictive Content Security Policy
 *
 * @async
 * @param {string} text - The text to copy to the clipboard
 * @param {number} tabId - The Chrome tab ID to inject the script into
 * @returns {Promise<void>} Resolves when copy succeeds
 * @throws {Error} If clipboard write fails or script injection is blocked
 *
 * @example
 * try {
 *   await copyToClipboard('https://bit.ly/example', 12345);
 *   console.log('Copied successfully');
 * } catch (error) {
 *   console.error('Copy failed:', error.message);
 * }
 *
 * @see {@link https://developer.chrome.com/docs/extensions/reference/scripting/#method-executeScript}
 */
const copyToClipboard = async (text, tabId) => {
  try {
    // Execute script in target tab's context to access its Clipboard API
    // Returns array of InjectionResults; we only need the main frame result
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: async (textToCopy) => {
        try {
          await navigator.clipboard.writeText(textToCopy);
          return { success: true };
        } catch (error) {
          return { success: false, message: error.message };
        }
      },
      args: [text],
    });

    // result.result contains our { success, message } object from the injected function
    if (!result?.result?.success) {
      throw new Error(result?.result?.message || 'Clipboard write failed');
    }

    console.log('Successfully copied to clipboard:', text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
    throw err;
  }
};

/**
 * Displays a desktop notification to the user.
 *
 * Uses the Chrome notifications API to show a basic notification with the
 * extension's icon. Notifications are non-blocking and auto-dismiss.
 *
 * @param {string} message - The notification body text
 * @param {string} [title="PocketLink"] - The notification title
 * @returns {void}
 *
 * @example
 * showNotification('Shortlink copied to clipboard!');
 * showNotification('API Error', 'PocketLink Error');
 *
 * @see {@link https://developer.chrome.com/docs/extensions/reference/notifications/}
 */
const showNotification = (message, title = "PocketLink") => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
  });
};

/**
 * Creates the right-click context menu item for the extension.
 *
 * Registers a context menu item that appears when right-clicking on any page.
 * The menu item triggers the shortlink creation flow when clicked.
 *
 * ## Context Types
 *
 * The `contexts: ['page']` setting means the menu item appears when:
 * - Right-clicking on the page background
 * - Right-clicking on elements without their own context menu
 *
 * Other possible contexts (not used): 'selection', 'link', 'image', 'video', etc.
 *
 * @returns {void}
 *
 * @see {@link https://developer.chrome.com/docs/extensions/reference/contextMenus/}
 */
const setupContextMenu = () => {
  chrome.contextMenus.create({
    id: 'pocketlink',
    title: 'Create shortlink with PocketLink',
    contexts: ['page'],
  });
};

/**
 * Extension Installation Handler
 *
 * Runs once when the extension is first installed or updated.
 * Sets up the context menu for right-click functionality.
 *
 * @listens chrome.runtime.onInstalled
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('PocketLink extension installed. Setting up context menu.');
  setupContextMenu();
});

/**
 * Context Menu Click Handler
 *
 * Main entry point for shortlink creation. Triggered when user right-clicks
 * and selects "Create shortlink with PocketLink".
 *
 * ## Flow
 *
 * 1. Load user settings from chrome.storage.sync
 * 2. Validate Bitly API token exists
 * 3. Create shortlink via Bitly API
 * 4. Copy/display shortlink based on interaction mode preference
 * 5. Show notification if enabled
 *
 * ## Error Handling
 *
 * - Missing token: Opens options page with notification
 * - API errors: Shows error notification
 * - Clipboard errors: Falls back to popup mode (if fallbackMode enabled)
 *
 * @listens chrome.contextMenus.onClicked
 * @param {chrome.contextMenus.OnClickData} info - Click event data containing pageUrl
 * @param {chrome.tabs.Tab} tab - The tab where the context menu was invoked
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'pocketlink') {
    console.log('Context menu clicked. Starting process...');

    try {
      // Load settings with defaults from synced storage
      const settings = await chrome.storage.sync.get({
        bitlyToken: '',
        interactionMode: 'injection',
        showNotifications: true,
        fallbackMode: true
      });

      // Token validation - prompt user to configure if missing
      if (!settings.bitlyToken) {
        if (settings.showNotifications) {
          showNotification('Please set your Bitly API key in the options.');
        }
        chrome.runtime.openOptionsPage();
        return;
      }

      // Create shortlink via Bitly API
      const shortUrl = await createShortlink(info.pageUrl, settings.bitlyToken);

      // Handle clipboard/display based on user's interaction mode preference
      await handleShortlink(shortUrl, settings, tab);

    } catch (error) {
      console.error('PocketLink error:', error);
      const settings = await chrome.storage.sync.get({ showNotifications: true });
      if (settings.showNotifications) {
        showNotification('Error creating shortlink. Please try again.');
      }
    }
  }
});

/**
 * Creates a shortened URL using the Bitly API.
 *
 * Makes a POST request to Bitly's v4 shorten endpoint to create a new short link.
 *
 * ## API Request
 *
 * ```http
 * POST https://api-ssl.bitly.com/v4/shorten
 * Content-Type: application/json
 * Authorization: Bearer <token>
 *
 * { "long_url": "https://example.com/very/long/url" }
 * ```
 *
 * ## API Response (Success)
 *
 * ```json
 * {
 *   "link": "https://bit.ly/abc123",
 *   "id": "bit.ly/abc123",
 *   "long_url": "https://example.com/very/long/url",
 *   "created_at": "2024-01-01T00:00:00+0000"
 * }
 * ```
 *
 * ## Common Error Codes
 *
 * | Status | Meaning |
 * |--------|---------|
 * | 400 | Invalid URL format or already a Bitly link |
 * | 401 | Invalid or expired API token |
 * | 403 | Rate limit exceeded or account suspended |
 * | 500 | Bitly server error |
 *
 * @async
 * @param {string} url - The long URL to shorten
 * @param {string} token - Bitly API access token (obtain from https://app.bitly.com/settings/api/)
 * @returns {Promise<string>} The shortened URL (e.g., "https://bit.ly/abc123")
 * @throws {Error} If API request fails or response is invalid
 *
 * @example
 * const shortUrl = await createShortlink(
 *   'https://example.com/very/long/url',
 *   'your_bitly_token'
 * );
 * console.log(shortUrl); // "https://bit.ly/abc123"
 *
 * @see {@link https://dev.bitly.com/api-reference/#createBitlink}
 */
async function createShortlink(url, token) {
  const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ long_url: url }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data || !data.link) {
    throw new Error('Invalid response from Bit.ly API');
  }

  return data.link;
}

/**
 * Routes the shortlink to the appropriate clipboard/display method based on user settings.
 *
 * Acts as a controller that dispatches to one of three handlers:
 * - `copyViaOffscreen()` for offscreen mode
 * - `copyToClipboard()` for injection mode
 * - `showInPopup()` for popup mode
 *
 * ## Interaction Modes
 *
 * | Mode | Method | Pros | Cons |
 * |------|--------|------|------|
 * | `offscreen` | Offscreen document | Most reliable | Requires Chrome 109+ |
 * | `injection` | Script injection | Fast, no extra window | Fails on restricted pages |
 * | `popup` | Popup window | Always works | Requires manual copy |
 *
 * ## Fallback Behavior
 *
 * When `settings.fallbackMode` is true and the primary mode fails:
 * - `offscreen` → falls back to `popup`
 * - `injection` → falls back to `popup`
 * - `popup` → no fallback (throws error)
 *
 * The popup mode never has a fallback because it's the most permissive
 * (always works) and is itself the fallback target.
 *
 * @async
 * @param {string} shortUrl - The shortened URL to copy/display
 * @param {PocketLinkSettings} settings - User settings object
 * @param {chrome.tabs.Tab} tab - The current tab (needed for injection mode)
 * @returns {Promise<void>}
 * @throws {Error} If primary mode fails and fallback is disabled or unavailable
 *
 * @example
 * await handleShortlink('https://bit.ly/abc', settings, tab);
 */
async function handleShortlink(shortUrl, settings, tab) {
  console.log(`Using interaction mode: ${settings.interactionMode}`);

  try {
    switch (settings.interactionMode) {
      case 'offscreen':
        await copyViaOffscreen(shortUrl, settings);
        break;

      case 'injection':
        await copyToClipboard(shortUrl, tab.id);
        if (settings.showNotifications) {
          showNotification('Shortlink created and copied to clipboard!');
        }
        break;

      case 'popup':
        await showInPopup(shortUrl);
        break;

      default:
        // Unknown mode - fallback to injection as it's the default
        await copyToClipboard(shortUrl, tab.id);
        if (settings.showNotifications) {
          showNotification('Shortlink created and copied to clipboard!');
        }
    }
  } catch (error) {
    console.error(`${settings.interactionMode} mode failed:`, error);

    // Attempt fallback to popup mode if enabled and not already using popup
    if (settings.fallbackMode && settings.interactionMode !== 'popup') {
      console.log('Falling back to popup mode');
      await showInPopup(shortUrl);
    } else {
      throw error;
    }
  }
}

/**
 * Copies text to clipboard using an offscreen document.
 *
 * This is the "offscreen mode" clipboard method. It creates a hidden document
 * that has access to the Clipboard API, uses it to copy the text, then cleans up.
 *
 * ## Why Offscreen Documents?
 *
 * In Manifest V3, service workers don't have access to DOM APIs like `navigator.clipboard`.
 * Offscreen documents provide a way to create a hidden page that has full DOM access,
 * allowing clipboard operations without user interaction.
 *
 * ## Lifecycle Management
 *
 * 1. Check if an offscreen document already exists
 * 2. Create one if needed (track in `createdContext`)
 * 3. Send copy message to the offscreen document
 * 4. Clean up: close document if we created it (in `finally` block)
 *
 * The `finally` block ensures cleanup happens even if the copy operation fails.
 * We only close documents we created to avoid closing documents that might
 * be reused by subsequent calls.
 *
 * ## Message Protocol
 *
 * Sends to offscreen.js:
 * ```javascript
 * { action: 'copyToClipboard', text: 'https://bit.ly/abc' }
 * ```
 *
 * Expected response:
 * ```javascript
 * { success: true } // or { success: false, error: 'reason' }
 * ```
 *
 * @async
 * @param {string} shortUrl - The URL to copy to clipboard
 * @param {PocketLinkSettings} settings - User settings (for notification preference)
 * @returns {Promise<void>}
 * @throws {Error} If offscreen API unavailable or clipboard write fails
 * @requires Chrome 109+ for chrome.offscreen API
 *
 * @example
 * await copyViaOffscreen('https://bit.ly/abc', { showNotifications: true });
 *
 * @see {@link https://developer.chrome.com/docs/extensions/reference/offscreen/}
 */
async function copyViaOffscreen(shortUrl, settings) {
  let createdContext = false;
  try {
    // Ensure offscreen document exists; track if we created it for cleanup
    createdContext = await ensureOffscreenDocument();
  } catch (error) {
    console.error('Offscreen clipboard copy is unavailable:', error);
    throw error;
  }

  // Send copy request to offscreen document via chrome.runtime messaging
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'copyToClipboard',
      text: shortUrl
    });

    if (!response?.success) {
      throw new Error(response?.error || 'Clipboard write failed');
    }

    if (settings.showNotifications) {
      showNotification('Shortlink created and copied to clipboard!');
    }
  } finally {
    // Clean up: only close the document if we created it in this call
    // This prevents closing a document that another operation might need
    if (createdContext) {
      try {
        await chrome.offscreen.closeDocument();
      } catch (error) {
        console.warn('Failed to close offscreen document:', error);
      } finally {
        offscreenDocumentCreated = false;
      }
    }
  }
}

/**
 * Displays the shortlink in a popup window for manual copying.
 *
 * This is the "popup mode" clipboard method and fallback for when other modes fail.
 * It creates a small popup window showing the shortlink with a copy button.
 *
 * ## Storage Strategy
 *
 * Uses `chrome.storage.local` (not `sync`) to store the shortlink temporarily:
 * - **local**: Fast, doesn't sync to other devices, suitable for ephemeral data
 * - **sync**: Slower, syncs across devices, better for persistent settings
 *
 * The popup reads this value on load and displays it. The value persists until
 * overwritten by the next shortlink creation.
 *
 * ## Popup Window Configuration
 *
 * - **type: 'popup'**: Creates a minimal window without address bar or tabs
 * - **width: 360**: Compact width suitable for displaying short URLs
 * - **height: 200**: Minimal height for URL display and copy button
 *
 * ## Data Flow
 *
 * ```
 * background.js                     popup.js
 *     │                                │
 *     ├─► storage.local.set() ────────►│
 *     │   { currentShortlink: url }    │
 *     │                                │
 *     ├─► windows.create() ───────────►│
 *     │   (opens popup.html)           │
 *     │                                ├─► storage.local.get()
 *     │                                │   reads currentShortlink
 *     │                                ├─► displays URL
 * ```
 *
 * @async
 * @param {string} shortUrl - The shortened URL to display
 * @returns {Promise<void>}
 *
 * @example
 * await showInPopup('https://bit.ly/abc123');
 * // Opens a 360x200 popup window showing the URL
 *
 * @see {@link https://developer.chrome.com/docs/extensions/reference/windows/#method-create}
 */
async function showInPopup(shortUrl) {
  // Store shortlink in local storage for popup.js to read
  // Using 'local' (not 'sync') as this is ephemeral data that doesn't need to sync
  await chrome.storage.local.set({ currentShortlink: shortUrl });

  // Create a minimal popup window to display the shortlink
  await chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 360,
    height: 200
  });
}

/**
 * Message Handler for Inter-Component Communication
 *
 * Handles incoming messages from other extension components (popup, options page).
 * Currently supports creating shortlinks from the popup UI.
 *
 * ## Supported Actions
 *
 * ### `createShortlinkFromPopup`
 *
 * Creates a shortlink for the current active tab's URL.
 *
 * **Request:**
 * ```javascript
 * { action: 'createShortlinkFromPopup' }
 * ```
 *
 * **Response (success):**
 * ```javascript
 * { success: true, shortUrl: 'https://bit.ly/abc123' }
 * ```
 *
 * **Response (failure):**
 * ```javascript
 * { success: false, error: 'Error message here' }
 * ```
 *
 * ## Async Message Handling Pattern
 *
 * Chrome's message listener requires special handling for async responses:
 * 1. Wrap async code in an IIFE: `(async () => { ... })()`
 * 2. Return `true` from the listener to indicate async response
 * 3. Call `sendResponse()` when the async operation completes
 *
 * If you don't return `true`, the message channel closes before
 * the async operation completes, and the popup never receives a response.
 *
 * @listens chrome.runtime.onMessage
 * @param {Object} message - The message object with `action` property
 * @param {chrome.runtime.MessageSender} sender - Information about the sender
 * @param {function} sendResponse - Callback to send response back to sender
 * @returns {boolean} `true` to indicate async response handling
 *
 * @see {@link https://developer.chrome.com/docs/extensions/reference/runtime/#event-onMessage}
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'createShortlinkFromPopup') {
    // Use IIFE pattern for async message handling
    // Must return true below to keep message channel open
    (async () => {
      try {
        // Query for the active tab in the current window
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.url) {
          sendResponse({ success: false, error: 'No active tab is available to shorten.' });
          return;
        }

        // Load settings to get API token
        const settings = await chrome.storage.sync.get({
          bitlyToken: '',
          showNotifications: true
        });

        if (!settings.bitlyToken) {
          sendResponse({ success: false, error: 'Please set your Bitly API key in the options.' });
          return;
        }

        // Create the shortlink via Bitly API
        const shortUrl = await createShortlink(tab.url, settings.bitlyToken);
        sendResponse({ success: true, shortUrl });
      } catch (error) {
        console.error('Popup shortlink creation failed:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    // Return true to indicate we'll call sendResponse asynchronously
    // This keeps the message channel open until sendResponse is called
    return true;
  }
});
