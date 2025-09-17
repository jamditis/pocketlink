// background.js

// This function is the correct way to copy text to the clipboard in a Manifest V3 service worker.
// It injects a small script into the active tab to perform the copy operation.
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
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Ensure the click was on our specific menu item.
  if (info.menuItemId === 'pocketlink') {
    console.log('Context menu clicked. Starting process...');
    
    // 1. Get the Bitly API token from storage.
    chrome.storage.sync.get('bitlyToken', ({ bitlyToken }) => {
      if (bitlyToken) {
        console.log('Successfully retrieved API token.');
        
        // 2. Make the API call to Bit.ly.
        fetch('https://api-ssl.bitly.com/v4/shorten', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bitlyToken}`,
          },
          body: JSON.stringify({
            long_url: info.pageUrl,
          }),
        })
        .then(response => {
          // Check if the response from the server is okay.
          if (!response.ok) {
            // If not, we throw an error to be caught by the .catch block.
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('Bit.ly API response received:', data);
          if (data && data.link) {
            // 3. If we get a valid link, copy it to the clipboard.
            copyToClipboard(data.link, tab.id).then(() => {
              // 4. Show a success notification.
              showNotification('Shortlink created and copied to clipboard!');
            });
          } else {
            // Handle cases where the API returns data but no link.
            console.error('API Error: Invalid response from Bit.ly', data);
            showNotification('Error: Invalid response from Bit.ly. Please check your token.');
          }
        })
        .catch(error => {
          // Handle network errors or failed HTTP responses.
          console.error('PocketLink API fetch error:', error);
          showNotification('Network or API error. Please try again.');
        });
        
      } else {
        // If no token is found in storage.
        console.warn('API token not found.');
        showNotification('Please set your Bitly API key in the options.');
        // Optional: Open the options page for the user.
        chrome.runtime.openOptionsPage();
      }
    });
  }
});