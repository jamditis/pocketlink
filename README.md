# **PocketLink**

**Effortless shortlinks, right where you need them.**

PocketLink is a lightweight and secure Chromium browser extension that creates a Bit.ly shortlink for the current page and copies it to your clipboard in a single click. It's built to be fast, unobtrusive, and feel like a native part of your browser.

## **Why PocketLink?**

In many workflows, sharing links is a constant action. The process of copying a URL, opening a new tab, navigating to a link shortener, pasting the link, and copying the result is inefficient. PocketLink streamlines this into a single right-click action, saving time and keeping you focused.

## **Features**

* **Seamless integration:** Adds a "Create shortlink" option directly to your right-click context menu.  
* **Instant clipboard access:** The generated shortlink is automatically copied to your clipboard.  
* **Secure storage:** Your Bit.ly access token is stored safely using chrome.storage.sync, allowing it to sync across your devices.  
* **Minimalist design:** No popups, no extra tabs. Just a simple success notification.  
* **Privacy-focused:** The extension only requests the permissions it absolutely needs to function and does not track your browsing activity.

## **Installation**

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

Before using the extension, you must add your Bit.ly API key:

1. Generate a **generic access token** from your Bit.ly account settings: https://app.bitly.com/settings/api/.  
2. Click the PocketLink icon in your browser's toolbar to open the options page.  
3. Paste your access token into the input field and click "Save".

The extension is now ready to use\!

## **How to contribute**

Contributions are welcome\! Whether it's a bug report, feature request, or a pull request, we'd love your help. Please read our [**Contributing Guidelines**](https://www.google.com/search?q=CONTRIBUTING.md) to get started.

## **License**

This project is licensed under the MIT License. See the [**LICENSE**](https://www.google.com/search?q=LICENSE) file for details.

*This is an unofficial extension and is not affiliated with, endorsed by, or sponsored by Bit.ly, Inc.*
