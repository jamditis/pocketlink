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
    const response = await chrome.runtime.sendMessage({ action: 'createShortlinkFromPopup' });

    if (!response?.success) {
      showError(response?.error || 'Unable to create shortlink.');
      return;
    }

    showSuccess(response.shortUrl);

  } catch (error) {
    showError(`Error: ${error.message}`);
  }
});

function showSuccess(shortUrl) {
  const contentDiv = document.getElementById('content');
  contentDiv.textContent = '';

  const container = document.createElement('div');
  container.className = 'url-container';

  const urlParagraph = document.createElement('p');
  urlParagraph.className = 'url';
  urlParagraph.id = 'shortUrl';
  urlParagraph.textContent = shortUrl;
  container.appendChild(urlParagraph);

  const copyButton = document.createElement('button');
  copyButton.className = 'copy-button';
  copyButton.id = 'copyButton';
  copyButton.textContent = 'Copy to Clipboard';

  const statusDiv = document.createElement('div');
  statusDiv.className = 'status';
  statusDiv.id = 'status';

  contentDiv.appendChild(container);
  contentDiv.appendChild(copyButton);
  contentDiv.appendChild(statusDiv);

  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      copyButton.disabled = true;
      statusDiv.textContent = 'Copied!';
      statusDiv.classList.remove('error');
      statusDiv.classList.add('success');

      // Close popup after brief delay
      setTimeout(() => {
        window.close();
      }, 800);
    } catch (error) {
      copyButton.disabled = false;
      statusDiv.textContent = 'Copy failed';
      statusDiv.classList.remove('success');
      statusDiv.classList.add('error');
    }
  });
}

function showError(message) {
  const contentDiv = document.getElementById('content');
  contentDiv.textContent = '';

  const statusDiv = document.createElement('div');
  statusDiv.className = 'status error';
  statusDiv.textContent = message;
  contentDiv.appendChild(statusDiv);

  if (/(bit.?ly|token)/i.test(message)) {
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Open Settings';
    button.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    contentDiv.appendChild(button);
  }
}
