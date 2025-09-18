![Screenshot of context menu option for PocketLink use](https://i.imgur.com/1iq2XKj.png)
# **PocketLink**

**Effortless shortlinks, right where you need them.**

PocketLink is a lightweight and secure Chromium browser extension that creates a Bit.ly shortlink for the current page and copies it to your clipboard in a single click. It's built to be fast, unobtrusive, and feel like a native part of your browser.

## **Why PocketLink?**

In many workflows, sharing links is a constant action. The process of copying a URL, opening a new tab, navigating to a link shortener, pasting the link, and copying the result is inefficient. PocketLink streamlines this into a single right-click action, saving time and keeping you focused.

![PocketLink logo](https://i.imgur.com/qPHQw27.png)

## **Features**

  * **Multiple interaction modes:** Choose how PocketLink
  behaves - auto-copy to clipboard, manual copy from popup, or
  hybrid fallback mode.
  * **Seamless integration:** Adds a "Create shortlink" option
  directly to your right-click context menu.
  * **Modern clipboard access:** Uses Chrome's official
  offscreen API for secure, reliable clipboard operations.
  * **Smart fallback system:** Automatically switches to
  alternative methods if your preferred mode fails.
  * **Secure storage:** Your Bit.ly access token is stored
  safely using chrome.storage.sync.
  * **Beautiful design:** Dark-themed interface with glass card
   effects and gradient styling.
  * **Privacy-focused:** Only requests the permissions it absolutely needs to function and does not track your browsing activity.

## **Installation**

  <img src="https://i.imgur.com/oGqQesl.jpeg" align="right"
  width="300" style="margin-left: 20px;">

### **For users**

The recommended way to install PocketLink is from the **Chrome Web Store**.

*(Link will be added here once the extension is published.)*

### **For developers**

If you'd like to load the extension from the source to test or contribute:

1. **Clone the repository:**  
   git clone \[https://github.com/jamditis/pocketlink.git\](https://github.com/jamditis/pocketlink.git)

2. Open your browser's extensions page:  
   Navigate to chrome://extensions in a Chromium-based browser.  
3. Enable developer mode:  
   Click the toggle switch in the top-right corner.  
4. Load the extension:  
   Click the "Load unpacked" button and select the cloned pocketlink directory.

## **Configuration**

Before using the extension, you must add your Bit.ly API key and choose your preferred interaction mode:

1. Generate a **generic access token** from your Bit.ly account settings: https://app.bitly.com/settings/api/.
2. Click the PocketLink icon in your browser's toolbar to open the options page.
3. Paste your access token into the input field.
4. **Choose your interaction mode:**
   * **Auto-copy to clipboard (Recommended):** Uses Chrome's modern offscreen API - works reliably on all sites
   * **Auto-copy via page injection:** Current method using content script injection
   * **Show in popup window:** Most compatible option - displays shortlink for manual copying
5. Configure additional settings like notifications and fallback behavior.
6. Click "Save Settings".

The extension is now ready to use\!

## **How to contribute**

Contributions are welcome\! Whether it's a bug report, feature request, or a pull request, we'd love your help. Please read our [**Contributing Guidelines**](https://github.com/jamditis/pocketlink/blob/main/CONTRIBUTING.md) to get started.

## **License**

This project is licensed under the MIT License. See the [**LICENSE**](https://github.com/jamditis/pocketlink/blob/main/LICENSE) file for details.

*This is an unofficial extension and is not affiliated with, endorsed by, or sponsored by Bit.ly, Inc.*
