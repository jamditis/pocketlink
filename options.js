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
  // Get the value from the text input field with the id 'token'.
  const token = document.getElementById('token').value;

  // Use the chrome.storage.sync API to save the data.
  // We save it as an object where the key is 'bitlyToken' and the value is the token string.
  chrome.storage.sync.set(
    { bitlyToken: token },
    () => {
      // This is a callback function that runs after the save operation is complete.
      // We use it to provide visual feedback to the user.
      const status = document.getElementById('status');
      status.textContent = 'Token saved successfully!';
      status.style.opacity = 1; // Fade the message in.

      // After 2 seconds, fade the message out again.
      setTimeout(() => {
        status.style.opacity = 0;
      }, 2000);
    }
  );
};

/**
 * Restores the saved token from chrome.storage.sync and populates the input field.
 * This ensures that when the user opens the options page, they see their currently saved token.
 */
const restoreOptions = () => {
  // Use the chrome.storage.sync API to get the data.
  // We provide a default value ({ bitlyToken: '' }) in case no token has been saved yet.
  chrome.storage.sync.get(
    { bitlyToken: '' },
    (items) => {
      // 'items' is the object returned from storage.
      // We set the value of the 'token' input field to the saved token.
      document.getElementById('token').value = items.bitlyToken;
    }
  );
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

