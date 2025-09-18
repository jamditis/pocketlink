// background.js

const copyToClipboard = async (text, tabId) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (textToCopy) => {
        navigator.clipboard.writeText(textToCopy);
      },
      args: [text],
    });
    console.log('Successfully copied to clipboard:', text);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

// This function creates a user-facing notification.
const showNotification = (message, title = "PocketLink") => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
  });
};

// This function handles the creation of the context menu when the extension is installed.
const setupContextMenu = () => {
  chrome.contextMenus.create({
    id: 'pocketlink',
    title: 'Create shortlink with PocketLink',
    contexts: ['page'],
  });
};

// This listener runs once when the extension is first installed or updated.
chrome.runtime.onInstalled.addListener(() => {
  console.log('PocketLink extension installed. Setting up context menu.');
  setupContextMenu();
});

// This listener fires when the user clicks on our context menu item.
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'pocketlink') {
    console.log('Context menu clicked. Starting process...');

    try {
      // Get settings from storage
      const settings = await chrome.storage.sync.get({
        bitlyToken: '',
        interactionMode: 'injection',
        showNotifications: true,
        fallbackMode: true
      });

      if (!settings.bitlyToken) {
        if (settings.showNotifications) {
          showNotification('Please set your Bitly API key in the options.');
        }
        chrome.runtime.openOptionsPage();
        return;
      }

      // Create shortlink
      const shortUrl = await createShortlink(info.pageUrl, settings.bitlyToken);

      // Handle based on interaction mode
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

// Create shortlink via Bit.ly API
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

// Handle shortlink based on user's interaction mode preference
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
        // Fallback to injection mode
        await copyToClipboard(shortUrl, tab.id);
        if (settings.showNotifications) {
          showNotification('Shortlink created and copied to clipboard!');
        }
    }
  } catch (error) {
    console.error(`${settings.interactionMode} mode failed:`, error);

    // Try fallback if enabled
    if (settings.fallbackMode && settings.interactionMode !== 'popup') {
      console.log('Falling back to popup mode');
      await showInPopup(shortUrl);
    } else {
      throw error;
    }
  }
}

// Copy via offscreen document (Chrome 109+)
async function copyViaOffscreen(shortUrl, settings) {
  // Create offscreen document if it doesn't exist
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: 'Write shortlink to clipboard'
    });
  }

  // Send message to offscreen document
  chrome.runtime.sendMessage({
    action: 'copyToClipboard',
    text: shortUrl
  });

  if (settings.showNotifications) {
    showNotification('Shortlink created and copied to clipboard!');
  }
}

// Show shortlink in popup window
async function showInPopup(shortUrl) {
  // Store the shortlink for the popup to access
  await chrome.storage.local.set({ currentShortlink: shortUrl });

  // Open popup window
  await chrome.windows.create({
    url: chrome.runtime.getURL('popup.html'),
    type: 'popup',
    width: 360,
    height: 200
  });
}
