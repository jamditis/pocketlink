# **Frequently Asked Questions (FAQ)**

### **Q: Is PocketLink secure? Can it read my browsing data?**

**A:** Yes, PocketLink is secure and privacy-focused. It cannot read your browsing history, see page content, or access passwords. The extension uses minimal permissions - activeTab and scripting only allow clipboard operations when you explicitly trigger the context menu. You can even choose "Popup Mode" in settings to eliminate automatic clipboard access entirely.

### **Q: What are the different interaction modes?**

**A:** PocketLink offers three interaction modes you can choose from in the options page:

- **Offscreen Mode (Recommended):** Uses Chrome's official clipboard API for reliable, secure clipboard access
- **Injection Mode:** Injects clipboard code into the current tab (works on most sites)
- **Popup Mode:** Opens a small window with the shortlink for manual copying (most compatible, works everywhere)

The extension automatically falls back to popup mode if your preferred method fails.

### **Q: Why do I need a Bit.ly account and access token?**

**A:** PocketLink uses the Bit.ly API to create shortlinks. Your personal token ensures all links are associated with your account, allowing you to:
- Track link analytics and click statistics
- Use custom domains (if you have Bit.ly Pro)
- Manage your links from your Bit.ly dashboard
- Keep your shortlinks organized and accessible

### **Q: I'm getting an error "The access token is invalid." What should I do?**

**A:** This means your token is incorrect or has been revoked. To fix this:

1. Generate a new Generic Access Token from [Bit.ly Settings > API](https://app.bitly.com/settings/api/)
2. Click the PocketLink icon in your browser toolbar to open options
3. Paste the new token and click "Save Token"
4. Try creating a shortlink again

### **Q: The clipboard isn't working. What should I try?**

**A:** Try these troubleshooting steps:

1. **Check your interaction mode:** Go to options and try switching to "Popup Mode" (most reliable)
2. **For Offscreen Mode:** Ensure you're using Chrome 109+ (required for offscreen API)
3. **For Injection Mode:** This won't work on chrome:// pages or some restricted sites
4. **General:** Try refreshing the page and using the context menu again

### **Q: Will this work in browsers other than Chrome?**

**A:** Yes! PocketLink works in any Chromium-based browser, including:
- **Microsoft Edge**
- **Brave Browser**
- **Vivaldi**
- **Opera**
- Any browser supporting Manifest V3 extensions

### **Q: Can I disable the success notifications?**

**A:** Yes! Go to the options page (click the PocketLink icon) and turn off "Show notifications." You'll still see error notifications for troubleshooting, but success notifications will be disabled.

### **Q: Why doesn't the extension work on some websites?**

**A:** Some sites (like chrome:// pages, browser settings, or sites with strict security policies) block extension functionality. If you encounter this:

1. Switch to "Popup Mode" in options (works on all sites)
2. Try the extension on a regular website to confirm it's working
3. Remember that internal browser pages (chrome://extensions) won't work with any extension

### **Q: How do I uninstall or reset my settings?**

**A:** To uninstall: Right-click the PocketLink icon → "Remove from Chrome"
To reset settings: Open options page → clear the token field → save (this will reset all preferences)

### **Q: I found a bug or have a feature request. Where can I report it?**

**A:** We welcome feedback! Please visit our [GitHub repository](https://github.com/jamditis/pocketlink/issues) to:
- Report bugs with detailed steps to reproduce
- Suggest new features or improvements
- View known issues and their status
- Contribute to the project if you're a developer

### **Q: Is my Bit.ly token stored securely?**

**A:** Yes. Your token is stored using Chrome's secure storage API (chrome.storage.sync) which:
- Encrypts data in transit and at rest
- Syncs securely across your Chrome devices
- Is isolated from other extensions and websites
- Cannot be accessed by malicious websites

The extension only sends your token to Bit.ly's official API over HTTPS connections.
