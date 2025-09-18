// popup.js - Handles popup UI for shortlink display

document.addEventListener('DOMContentLoaded', async () => {
  const contentDiv = document.getElementById('content');

  try {
    // Check if there's a stored shortlink (from popup mode)
    const stored = await chrome.storage.local.get('currentShortlink');

    if (stored.currentShortlink) {
      // Clear the stored link
      await chrome.storage.local.remove('currentShortlink');
      showSuccess(stored.currentShortlink);
      return;
    }

    // Otherwise, create new shortlink (direct popup usage)
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const settings = await chrome.storage.sync.get({
      bitlyToken: '',
      showNotifications: true
    });

    if (!settings.bitlyToken) {
      showError('Please set your Bit.ly token in extension options');
      return;
    }

    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.bitlyToken}`,
      },
      body: JSON.stringify({
        long_url: tab.url,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.link) {
      showSuccess(data.link);
    } else {
      showError('Invalid response from Bit.ly API');
    }

  } catch (error) {
    showError(`Error: ${error.message}`);
  }
});

function showSuccess(shortUrl) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="url-container">
      <p class="url" id="shortUrl">${shortUrl}</p>
    </div>
    <button class="copy-button" id="copyButton">Copy to Clipboard</button>
    <div class="status" id="status"></div>
  `;

  document.getElementById('copyButton').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      document.getElementById('status').innerHTML = '<span class="success">Copied!</span>';

      // Close popup after brief delay
      setTimeout(() => {
        window.close();
      }, 800);
    } catch (error) {
      document.getElementById('status').innerHTML = '<span class="error">Copy failed</span>';
    }
  });
}

function showError(message) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="status error">${message}</div>
    <button class="copy-button" onclick="chrome.runtime.openOptionsPage()">Open Settings</button>
  `;
}
