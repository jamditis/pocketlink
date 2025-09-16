# **Technical requirements document: PocketLink**

Author: Joe Amditis  
Version: 1.0  
Date: 2025-09-16

### **1\. System overview**

PocketLink is a browser extension for Chromium-based browsers (Google Chrome, Microsoft Edge, etc.) built using the Manifest V3 standard. The architecture is event-driven, centered around a background service worker that remains inactive until triggered by a user action, ensuring minimal resource consumption.

### **2\. Architecture and components**

The extension consists of three primary components:

1. **manifest.json (Manifest V3)**  
   * **Purpose:** The core configuration file that defines the extension's properties, permissions, and scripts.  
   * **Key Properties:**  
     * "manifest\_version": 3  
     * "name": "PocketLink"  
     * "permissions": \["contextMenus", "storage", "activeTab", "scripting", "notifications"\]  
     * "host\_permissions": \["https://api-ssl.bitly.com/"\]  
     * "background": { "service\_worker": "background.js" }  
     * "options\_page": "options.html"  
2. **background.js (Service Worker)**  
   * **Purpose:** An event-driven script that handles all background logic.  
   * **Responsibilities:**  
     * **Initialization:** On the chrome.runtime.onInstalled event, it creates the context menu item.  
     * **Event Handling:** Listens for the chrome.contextMenus.onClicked event to initiate the link shortening process.  
     * **API Communication:** Retrieves the access token from chrome.storage.sync and makes an authenticated POST request to the Bit.ly API.  
     * **Error Handling:** Catches potential network or API errors and displays a user-friendly notification.  
     * **Coordination:** Triggers the clipboard injection script upon a successful API call.  
3. **options.html & options.js**  
   * **Purpose:** A standard HTML/CSS/JS page for user configuration.  
   * **Functionality:**  
     * Provides an input field for the user to enter their Bit.ly Generic Access Token.  
     * Uses options.js to handle DOM events (button clicks).  
     * Interfaces with the chrome.storage.sync API to securely save and retrieve the token.  
4. **Injected Content Script (via chrome.scripting)**  
   * **Purpose:** To gain access to the navigator.clipboard API, which is unavailable in the service worker context.  
   * **Implementation:** The copyToClipboard function in background.js uses chrome.scripting.executeScript to dynamically inject a small function into the active tab. This function's sole responsibility is to write the provided shortlink text to the clipboard.

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
* **Permissions:** The extension requests the minimum set of permissions required for functionality.  
* **Host Permissions:** API calls are restricted exclusively to https://api-ssl.bitly.com/, preventing the extension from communicating with any other domains.