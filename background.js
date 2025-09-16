// background.js (Service Worker)
// This script runs in the background of the browser and listens for events.
// It's the central nervous system of the extension, handling tasks that don't
// require a visible webpage, like creating context menus and API calls.

/**
 * Creates the right-click context menu item for the extension.
 * A context menu is the menu that appears when you right-click on a webpage.
 */
const createContextMenu = () => {
  // chrome.contextMenus.create is the function to add a new item.
  // We provide it with an object containing the details of our menu item.
  chrome.contextMenus.create({
    id: "createShortlink", // A unique ID to identify our menu item.
    title: "Create shortlink with PocketLink", // The text that will be displayed to the user.
    contexts: ["page"], // This specifies that the menu item should only appear when right-clicking on the main page area.
  });
};

/**
 * Listens for the 'onInstalled' event from the chrome.runtime API.
 * This event fires only when the extension is first installed or updated.
 * It's the perfect place to set up initial configurations like our context menu.
 */
chrome.runtime.onInstalled.addListener((details) => {
  // When the extension is installed, we call our function to create the context menu.
  createContextMenu();

  // Check if the reason for the installation is 'install' (i.e., it's the first time).
  // This prevents the welcome page from opening on every update.
  if (details.reason === 'install') {
    // Open the welcome page in a new tab to guide the user through setup.
    chrome.tabs.create({
      url: 'welcome.html'
    });
  }
});

/**
 * Listens for the 'onClicked' event from the chrome.contextMenus API.
 * This event fires whenever a user clicks on any context menu item created by this extension.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // We check if the clicked menu item's ID matches the one we created.
  // This is important if the extension were to have multiple context menu items.
  if (info.menuItemId === "createShortlink") {
    // 'info.pageUrl' contains the URL of the page the user right-clicked on.
    const pageUrl = info.pageUrl;

    // STEP 1: Get the Bit.ly access token from storage.
    // chrome.storage.sync allows us to save and retrieve user data that is synced across devices.
    chrome.storage.sync.get(['bitlyToken'], async (result) => {
      // The result is an object containing the keys we requested.
      const token = result.bitlyToken;

      // If the token is not found or is empty, the user hasn't configured the extension.
      if (!token) {
        // We open the options page so the user can enter their token.
        chrome.runtime.openOptionsPage();
        return; // Stop the function here.
      }

      // STEP 2: Make the API call to the Bit.ly service to shorten the URL.
      try {
        // We use the 'fetch' API to make a network request. 'await' pauses the function
        // until the request is complete. This is why the parent function is marked 'async'.
        const response = await fetch("https://api-ssl.bitly.com/v4/shorten", {
          method: "POST", // We are sending data, so we use the POST method.
          headers: {
            // The 'Authorization' header is required by the Bit.ly API for authentication.
            "Authorization": `Bearer ${token}`,
            // The 'Content-Type' header tells the server we are sending data in JSON format.
            "Content-Type": "application/json",
          },
          // The 'body' of the request contains the data we want to send.
          // We use JSON.stringify to convert our JavaScript object into a JSON string.
          body: JSON.stringify({ long_url: pageUrl }),
        });

        // If the response from the server is not successful (e.g., status 400 or 500),
        // we should handle it as an error.
        if (!response.ok) {
          const errorData = await response.json(); // Try to get more error info from the response body.
          // We 'throw' an error, which will be caught by the 'catch' block below.
          throw new Error(errorData.description || `HTTP error! status: ${response.status}`);
        }

        // If the request was successful, we parse the JSON response from the server.
        const data = await response.json();
        // The shortened URL is in the 'link' property of the response data.
        const shortUrl = data.link;

        // STEP 3: Copy the generated shortlink to the user's clipboard.
        copyToClipboard(tab.id, shortUrl);

      } catch (error) {
        // This 'catch' block will execute if any part of the 'try' block fails.
        console.error("Failed to shorten URL:", error);
        // We create a desktop notification to inform the user about the error.
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png', // Path to the extension icon.
            title: 'PocketLink error',
            message: `Could not create shortlink. Error: ${error.message}`
        });
      }
    });
  }
});

/**
 * Injects a content script into the active tab to copy text to the clipboard.
 * The navigator.clipboard API is only available in a page's context, not in a service worker.
 * So, we must execute a script on the page itself to perform the copy action.
 * @param {number} tabId - The ID of the tab to execute the script on.
 * @param {string} text - The text to be copied to the clipboard.
 */
function copyToClipboard(tabId, text) {
  // chrome.scripting.executeScript allows us to run code in the context of a webpage.
  chrome.scripting.executeScript({
    target: { tabId: tabId }, // Specify which tab to run the script in.
    // 'func' is the actual function that will be executed on the page.
    // Note: This function cannot access any variables from the background script's scope.
    // We must pass any needed data via the 'args' array.
    func: (textToCopy) => {
      // This code runs on the webpage.
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          console.log('Copied to clipboard successfully!');
        })
        .catch(err => {
          console.error('Failed to copy to clipboard:', err);
        });
    },
    args: [text] // Pass the 'text' variable from the background script to our function on the page.
  }, () => {
    // This callback function runs after the script has been executed.
    // We show a success notification to the user.
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Link created!',
        message: `Shortlink copied to clipboard: ${text}`
    });
  });
}

/**
 * Listens for when the user clicks the extension's icon in the browser toolbar.
 * We want this action to open the options page so the user can easily find the settings.
 */
chrome.action.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage();
});


