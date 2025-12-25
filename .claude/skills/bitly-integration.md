# Bit.ly API Integration

## Activation
Use when: creating shortlinks, validating API tokens, handling API errors, or extending URL shortening functionality.

## Mental Model

Bit.ly's API is a **REST service with bearer authentication**. Every request needs:
1. Valid API token (user-provided, stored securely)
2. HTTPS endpoint
3. JSON request/response handling

**PocketLink flow:**
```
User Action → Get Token from Storage → POST to Bit.ly → Parse Response → Copy Result
```

## API Reference

**Shorten endpoint:**
```
POST https://api-ssl.bitly.com/v4/shorten
Authorization: Bearer {token}
Content-Type: application/json

{
  "long_url": "https://example.com/very/long/path"
}
```

**Success response (200):**
```json
{
  "created_at": "2025-01-15T10:30:00+0000",
  "id": "bit.ly/abc123",
  "link": "https://bit.ly/abc123",
  "long_url": "https://example.com/very/long/path"
}
```

**Error response (4xx/5xx):**
```json
{
  "message": "INVALID_ARG_LONG_URL",
  "description": "The value provided is invalid.",
  "resource": "bitlinks",
  "errors": [
    {
      "field": "long_url",
      "error_code": "invalid"
    }
  ]
}
```

## Implementation Pattern

**Core shortening function (background.js:25-60):**
```javascript
async function createShortlink(url, token) {
  const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ long_url: url })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  const data = await response.json();
  return data.link;
}
```

## Token Management

**Storage pattern:**
```javascript
// Save token securely
async function saveToken(token) {
  await chrome.storage.sync.set({ bitlyToken: token });
}

// Retrieve with validation
async function getToken() {
  const { bitlyToken } = await chrome.storage.sync.get('bitlyToken');
  if (!bitlyToken) {
    throw new Error('No API token configured');
  }
  return bitlyToken;
}
```

**Token validation (recommended enhancement):**
```javascript
async function validateToken(token) {
  try {
    const response = await fetch('https://api-ssl.bitly.com/v4/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}
```

## Error Handling Strategy

**Categorize errors for user-friendly messages:**
```javascript
function getErrorMessage(error, response) {
  if (!response) {
    return 'Network error. Check your connection.';
  }

  switch (response.status) {
    case 401:
      return 'Invalid API token. Please check your settings.';
    case 403:
      return 'Access forbidden. Your token may have expired.';
    case 400:
      if (error.message === 'INVALID_ARG_LONG_URL') {
        return 'Invalid URL format.';
      }
      return 'Invalid request. Please try again.';
    case 429:
      return 'Rate limit exceeded. Please wait and try again.';
    case 500:
    case 502:
    case 503:
      return 'Bit.ly service unavailable. Please try later.';
    default:
      return 'Error creating shortlink. Please try again.';
  }
}
```

## API Limits & Considerations

**Rate limits (free tier):**
- 1,000 shortens per month
- 100 requests per minute

**Best practices:**
- Cache recently created links (avoid duplicate shortens)
- Show rate limit warnings to users
- Implement exponential backoff for retries

**Caching pattern:**
```javascript
async function getOrCreateShortlink(longUrl, token) {
  // Check cache first
  const cache = await chrome.storage.local.get('linkCache');
  const cached = cache.linkCache?.[longUrl];

  if (cached && Date.now() - cached.timestamp < 86400000) { // 24h
    return cached.shortUrl;
  }

  // Create new shortlink
  const shortUrl = await createShortlink(longUrl, token);

  // Update cache
  const newCache = { ...cache.linkCache, [longUrl]: { shortUrl, timestamp: Date.now() }};
  await chrome.storage.local.set({ linkCache: newCache });

  return shortUrl;
}
```

## Future Enhancements

**Custom domains (Bit.ly Pro):**
```javascript
// The API supports custom domains for paid accounts
{
  "long_url": "https://example.com/path",
  "domain": "your-brand.link"  // Custom domain
}
```

**Link analytics:**
```
GET https://api-ssl.bitly.com/v4/bitlinks/{bitlink}/clicks
```

**Bulk shortening:**
```
POST https://api-ssl.bitly.com/v4/shorten/bulk
```

## Anti-Patterns

❌ **Storing token in plain text files**
```javascript
// BAD: Exposed in source
const TOKEN = 'abc123...';

// GOOD: User-provided, encrypted storage
const { bitlyToken } = await chrome.storage.sync.get('bitlyToken');
```

❌ **Not handling network failures**
```javascript
// BAD: Unhandled rejection
const response = await fetch(url);

// GOOD: Proper error handling
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
} catch (error) {
  if (error.name === 'TypeError') {
    // Network error
  }
}
```

## Version: 1.0.0
## References: extension/background.js:25-60, docs/TRD.md
