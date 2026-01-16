# PocketLink

Chromium browser extension for creating Bit.ly shortlinks from the context menu.

## Overview

PocketLink adds a "Create shortlink" option to the browser context menu. One click creates a shortened URL and copies it to clipboard.

Published in Chrome Web Store: https://chromewebstore.google.com/detail/pocketlink/fiiplgpcffalbfmbafflbokkghnkcadm

## Tech stack

- Chrome Extension APIs (Manifest V3)
- Bit.ly API for URL shortening
- Offscreen API for clipboard access

## Directory structure

```
pocketlink/
├── extension/        # Extension source files
├── docs/             # Documentation
├── github/           # GitHub templates
├── CHANGELOG.md      # Version history
└── README.md         # User documentation
```

## Features

- Multiple interaction modes (auto-copy, popup, hybrid)
- Context menu integration
- Secure clipboard operations via offscreen API

---

## Multi-machine workflow

This repo is developed across multiple machines. GitHub is the source of truth.

**Before switching machines:**
```bash
git add . && git commit -m "WIP" && git push
```

**After switching machines:**
```bash
git pull
```
