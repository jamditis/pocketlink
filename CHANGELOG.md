# **Changelog**

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## **\[1.1.2\] \- 2025-10-30**

### **Fixed**

* **Clipboard Reliability:** Returned results from injected clipboard writes and waited for offscreen responses so errors surface and cleanup occurs consistently. Reused offscreen documents when available and closed them after successful writes to keep resource usage low.
* **Popup Robustness:** Rebuilt the popup rendering with DOM operations, providing clearer success and error messaging, resilient copy button state changes, and graceful handling when no active tab is available or Bitly tokens are missing.

### **Changed**

* **Permissions & Messaging:** Added the required `tabs` and `windows` permissions and routed popup-driven shortlink creation through the background service worker for centralized Bitly fetching and error reporting.

## **\[1.1.1\] \- 2025-09-18**

### **Fixed**

* **Chrome Web Store Compliance:** Removed all remotely hosted code violations that would cause automatic rejection
  * Replaced Google Fonts CDN links with web-safe system font stacks in all HTML files
  * Updated `options.html`, `welcome.html`, and `popup.html` to use local fonts only
  * Fixed offscreen document error handling to prevent "Receiving end does not exist" console errors
* **Documentation Updates:** Comprehensive refresh of all project documentation
  * **FAQ.md:** Complete rewrite with new interaction modes, troubleshooting, and 11 comprehensive Q&As
  * **PRD.md:** Updated to v1.1 with current feature set and completion status
  * **privacy.html:** Enhanced with detailed explanations of data storage and new interaction modes
  * **terms.html:** Updated date and ensured current accuracy

### **Changed**

* **Font System:** Switched from Google Fonts to system font stacks for Chrome Web Store compliance
  * `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  * Maintains visual consistency while ensuring policy compliance
* **Error Handling:** Enhanced offscreen document message sending with proper error catching
* **Store Readiness:** Created compliant extension package (`pocketlink-v1.1.0-store-ready.zip`)

### **Documentation**

* **Permission Justifications:** Researched and prepared ironclad justifications for Chrome Web Store submission
* **Privacy Policy:** Updated with detailed explanations of new interaction modes and data handling
* **FAQ Expansion:** Added troubleshooting guides for each interaction mode and browser compatibility
* **Chrome Web Store Listing:** Verified all required materials and compliance requirements

## **\[1.1.0\] \- 2025-09-17**

### **Added**

* **Multiple Interaction Modes:** Users can now choose how PocketLink behaves when creating shortlinks:
  * **Auto-copy to clipboard (Recommended):** Uses Chrome's official offscreen API for clipboard access (Chrome 109+)
  * **Auto-copy via page injection:** Current method using activeTab + scripting permissions
  * **Show in popup window:** Displays shortlink in popup for manual copying
* **Enhanced Settings Page:** Complete redesign with dark theme matching project aesthetic
  * Radio button selection for interaction modes
  * Toggle for success/error notifications
  * Toggle for auto-fallback behavior
  * Glass card effects and gradient styling
* **Smart Fallback System:** Automatically falls back to popup mode if preferred clipboard method fails
* **Offscreen Document Support:** Implements Chrome's recommended clipboard API for Manifest V3
* **Design Consistency:** All UI components now match the dark theme from docs/index.html
  * Emerald gradient buttons and accents
  * Poppins/Inter typography
  * Glass card backgrounds with backdrop blur

### **Changed**

* **Settings UI:** Complete visual overhaul with modern dark design
* **Architecture:** Modular system supports multiple clipboard access methods
* **Error Handling:** More graceful fallbacks and user-friendly error messages
* **Typography:** Updated to use Poppins for headings and Inter for body text

### **Technical**

* **New Permission:** Added `offscreen` permission for official clipboard API access
* **New Files:** Added `offscreen.html`, `offscreen.js`, `popup.html`, `popup.js` for new interaction modes
* **Refactored Background Script:** Cleaner async/await pattern with mode-specific handlers
* **Storage Schema:** Extended to include user preferences for interaction modes and behaviors

### **Documentation**

* **Updated Landing Page:** Replaced placeholder images with actual PocketLink screenshots
* **Enhanced README:** Added comprehensive feature descriptions and configuration instructions for multiple interaction modes
* **Technical Documentation:** Updated TRD.md with accurate architecture and security information
* **Developer Documentation:** Enhanced CLAUDE.md with new component structure and troubleshooting guidance

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
