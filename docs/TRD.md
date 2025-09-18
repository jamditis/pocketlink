# **Technical requirements document: PocketLink**

Author: Joe Amditis
Version: 1.1
Date: 2025-09-17

### **1\. System overview**

PocketLink is a browser extension for Chromium-based browsers (Google Chrome, Microsoft Edge, etc.) built using the Manifest V3 standard. The architecture is event-driven, centered around a background service worker that remains inactive until triggered by a user action, ensuring minimal resource consumption.

### **2\. Architecture and components**

The extension consists of multiple components supporting three distinct interaction modes:

#### **Core Components**

1. **manifest.json (Manifest V3)**
   * **Purpose:** The core configuration file that defines the extension's properties, permissions, and scripts.
   * **Key Properties:**
     * "manifest\_version": 3
     * "name": "PocketLink"
     * "permissions": \["contextMenus", "storage", "activeTab", "scripting", "notifications", "offscreen"\]
     * "host\_permissions": \["https://api-ssl.bitly.com/"\]
     * "background": { "service\_worker": "background.js" }
     * "options\_page": "options.html"

2. **background.js (Service Worker)**
   * **Purpose:** An event-driven script that handles all background logic and mode routing.
   * **Responsibilities:**
     * **Initialization:** Creates context menu item on chrome.runtime.onInstalled event
     * **Event Handling:** Listens for chrome.contextMenus.onClicked to initiate shortening process
     * **API Communication:** Makes authenticated POST requests to Bit.ly API
     * **Mode Management:** Routes clipboard operations based on user's selected interaction mode
     * **Fallback Logic:** Automatically switches to popup mode if preferred clipboard method fails
     * **Error Handling:** Provides graceful error handling with user-friendly notifications

3. **options.html & options.js**
   * **Purpose:** Enhanced settings page with dark theme and multiple configuration options.
   * **Functionality:**
     * API token input and storage
     * Radio button selection for interaction modes
     * Toggle switches for notifications and fallback behavior
     * Real-time settings validation and user feedback
     * Modern dark UI with glass card effects and gradient styling

#### **Interaction Mode Components**

4. **Offscreen Document Mode (offscreen.html & offscreen.js)**
   * **Purpose:** Implements Chrome's official clipboard API for Manifest V3.
   * **Implementation:** Uses chrome.offscreen.createDocument with CLIPBOARD reason to access navigator.clipboard.writeText in a secure context
   * **Advantages:** Most reliable, Chrome Web Store compliant, minimal permissions

5. **Content Script Injection Mode**
   * **Purpose:** Legacy clipboard access via content script injection.
   * **Implementation:** Uses chrome.scripting.executeScript to inject clipboard code into active tab
   * **Requirements:** Requires both "scripting" and "activeTab" permissions

6. **Popup Window Mode (popup.html & popup.js)**
   * **Purpose:** Displays shortlink in popup window for manual copying.
   * **Implementation:** Opens chrome.windows.create with popup type containing shortlink and copy button
   * **Advantages:** Most compatible, works on all sites, minimal permissions required

### **3\. External API specification**

* **Service:** Bit.ly API (for v1.0)  
* **Endpoint:** https://api-ssl.bitly.com/v4/shorten  
* **HTTP Method:** POST  
* **Authentication:**  
  * Type: Bearer Token  
  * Header: Authorization: Bearer \<YOUR\_GENERIC\_ACCESS\_TOKEN\>  
* **Request Body:**  
  * Format: application/json  
  * Content: { "long\_url": "THE\_URL\_TO\_SHORTEN" }  
* **Success Response (200 OK):**  
  * A JSON object containing the shortened link, e.g., { "link": "https://bit.ly/xxxx", ... }  
* **Error Response (e.g., 400 Bad Request):**  
  * A JSON object containing an error description, e.g., { "message": "INVALID\_ARG\_ACCESS\_TOKEN", "description": "The access token is invalid." }

### **4\. Security considerations**

* **Token Storage:** The user's access token is stored using chrome.storage.sync. This method is the sandboxed, secure storage mechanism recommended for extensions, and it allows the setting to sync across a user's logged-in devices.
* **Clipboard Access:** Multiple secure methods available:
  * **Offscreen API:** Uses Chrome's official clipboard API in isolated context (most secure)
  * **Content Script Injection:** Executes clipboard code only in user-initiated contexts with activeTab permission
  * **Popup Window:** Manual copy eliminates need for automatic clipboard access
* **Permissions Model:**
  * **Minimal Permissions:** Each interaction mode requests only the permissions it actually needs
  * **User Choice:** Users can select lower-permission modes (popup) for enhanced privacy
  * **Fallback Security:** Automatic downgrade to safer methods if preferred mode fails
* **Host Permissions:** API calls are restricted exclusively to https://api-ssl.bitly.com/, preventing the extension from communicating with any other domains.
* **Data Isolation:** User preferences stored separately from API tokens for enhanced security.
