// options.js
// This script provides the functionality for the options.html page.
// It handles saving the user's Bit.ly token to storage and loading it
// when the page is opened.

/**
 * Saves the options from the input field into chrome.storage.sync.
 * chrome.storage.sync is used so the token will be available across
 * all devices the user is logged into with their Google account.
 */
const saveOptions = () => {
  const token = document.getElementById('token').value;
  const interactionMode = document.querySelector('input[name="interactionMode"]:checked')?.value || 'injection';
  const showNotifications = document.getElementById('showNotifications').checked;
  const fallbackMode = document.getElementById('fallbackMode').checked;

  const settings = {
    bitlyToken: token,
    interactionMode: interactionMode,
    showNotifications: showNotifications,
    fallbackMode: fallbackMode
  };

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved successfully!';
    status.style.opacity = 1;

    setTimeout(() => {
      status.style.opacity = 0;
    }, 2000);
  });
};

/**
 * Restores the saved token from chrome.storage.sync and populates the input field.
 * This ensures that when the user opens the options page, they see their currently saved token.
 */
const restoreOptions = () => {
  const defaults = {
    bitlyToken: '',
    interactionMode: 'injection',
    showNotifications: true,
    fallbackMode: true
  };

  chrome.storage.sync.get(defaults, (items) => {
    document.getElementById('token').value = items.bitlyToken;

    // Set radio button selection
    const modeRadio = document.querySelector(`input[value="${items.interactionMode}"]`);
    if (modeRadio) {
      modeRadio.checked = true;
    }

    // Set checkbox states
    document.getElementById('showNotifications').checked = items.showNotifications;
    document.getElementById('fallbackMode').checked = items.fallbackMode;
  });
};

// --- Event Listeners ---
// These connect our functions to user actions on the page.

/**
 * Listens for the 'DOMContentLoaded' event. This event fires when the initial
 * HTML document has been completely loaded and parsed, without waiting for
 * stylesheets, images, and subframes to finish loading.
 * It's the perfect time to run setup code like restoring options.
 */
document.addEventListener('DOMContentLoaded', restoreOptions);

/**
 * Listens for a 'click' event on the button with the id 'save'.
 * When the button is clicked, it will execute the saveOptions function.
 */
document.getElementById('save').addEventListener('click', saveOptions);

