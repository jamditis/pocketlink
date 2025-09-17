# **Changelog**

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## **\[1.0.4\] \- 2025-09-17**

### **Fixed**

* **Core Functionality:** Resolved a critical bug preventing the "copy to clipboard" feature from working. The fix replaces a direct call to navigator.clipboard with the chrome.scripting.executeScript API, which is required by the Manifest V3 security model.  
* **Permissions:** Re-instated the activeTab permission. This grants the necessary temporary, user-invoked permission for the scripting API to function on any webpage without requiring broad host permissions.  
* **Error Handling:** Added logic to gracefully handle attempts to use the extension on protected browser pages (like edge://extensions), preventing security errors.

### **Changed**

* **Compliance:** Removed all remotely hosted code from welcome.html to comply with Chrome Web Store policy. All styling is now self-contained within the extension package.

## **\[1.0.1\] \- 2025-09-17**

### **Fixed**

* **Clipboard functionality:** Corrected the copy-to-clipboard feature to comply with Manifest V3 policies. The logic was moved from a direct navigator.clipboard call in the service worker to using the chrome.scripting.executeScript API, which resolves the "Cannot read properties of undefined (reading 'writeText')" error.

### **Technical**

* **Improved debugging:** Added detailed console.log statements to the background.js script to make tracking the flow of operations (token retrieval, API call, and copy action) easier.  
* **Refactored background.js:** Broke out functionality into smaller helper functions (copyToClipboard, showNotification) for better readability and maintenance.

## **\[1.0.0\] \- 2025-09-16**

### **Added**

* **Initial Release of PocketLink**  
* Context menu item "Create shortlink with PocketLink" on right-clicking a webpage.  
* Integration with the Bit.ly v4 API to shorten the current page's URL.  
* An options page (options.html) for users to securely save their Bit.ly Generic Access Token.  
* System notifications for successful link creation and for API/network errors.  
* Action to open the options page when clicking the extension's toolbar icon.  
* Comprehensive documentation including PRD, TRD, and FAQ.  
* Privacy policy and terms of service for Chrome Web Store compliance.  
* Professional landing page with installation instructions.
