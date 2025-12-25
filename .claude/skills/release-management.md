# Release Management

## Activation
Use when: preparing releases, updating versions, writing changelog entries, or submitting to Chrome Web Store.

## Mental Model

A release is a **coordinated version bump** across multiple files with a changelog entry. The version must match everywhere, and the changelog should explain what users gain.

**Version locations (must stay in sync):**
1. `extension/manifest.json` - `"version": "X.Y.Z"`
2. `CHANGELOG.md` - Header and entries
3. `docs/PRD.md` - Document version reference
4. `docs/TRD.md` - Document version reference

**Semantic versioning:**
- **MAJOR** (X.0.0) - Breaking changes, major features
- **MINOR** (0.X.0) - New features, backward compatible
- **PATCH** (0.0.X) - Bug fixes, minor improvements

## Release Workflow

### 1. Pre-release Checklist

```
□ All changes committed and pushed
□ Manual testing completed (see extension-testing skill)
□ No console errors in service worker
□ Options page saves/loads correctly
□ Context menu works on various sites
□ All three clipboard modes tested
```

### 2. Version Bump

**Update manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "PocketLink - URL Shortener",
  "version": "1.2.0",  // ← Update this
  ...
}
```

### 3. Changelog Entry

**Format (CHANGELOG.md):**
```markdown
## [1.2.0] - 2025-01-15

### Added
- New feature description

### Changed
- Improvement description

### Fixed
- Bug fix description

### Security
- Security improvement (if any)
```

**Categories to use:**
- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Features to be removed
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Vulnerability fixes

### 4. Update Documentation (if needed)

If the release changes documented behavior, update:
- `docs/PRD.md` - Product requirements
- `docs/TRD.md` - Technical details
- `docs/FAQ.md` - User-facing Q&A
- `README.md` - Installation/usage

### 5. Create Release Commit

```bash
git add extension/manifest.json CHANGELOG.md
git commit -m "Release v1.2.0: Brief description"
git tag v1.2.0
git push origin main --tags
```

## Chrome Web Store Submission

### Prepare Package

```bash
# Create zip excluding unnecessary files
cd extension
zip -r ../pocketlink-v1.2.0.zip . -x "*.DS_Store" -x "*.git*"
```

### Submission Checklist

```
□ Zip file created from extension/ directory
□ All icons present (16x16, 48x48, 128x128)
□ No external code (CDN scripts, remote CSS)
□ Permissions justified in manifest
□ Privacy policy URL valid
□ Screenshots updated (if UI changed)
□ Description updated (if features changed)
```

### Store Listing Updates

Update when:
- New features added (description, screenshots)
- Permissions changed (justification required)
- Privacy practices changed (privacy policy)

## Version History (Current)

```
1.1.2 - Clipboard reliability fixes, popup improvements
1.1.1 - Chrome Web Store compliance (fonts, styles)
1.1.0 - Three interaction modes, fallback system
1.0.0 - Initial release
```

## Rollback Procedure

If a release has critical bugs:

```bash
# Revert to previous version
git checkout v1.1.2
cd extension
zip -r ../pocketlink-rollback.zip .

# Submit rollback to Chrome Web Store
# Then fix issues on main branch
```

## Automated Release (Future Enhancement)

**GitHub Actions workflow concept:**
```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Create extension zip
        run: cd extension && zip -r ../pocketlink.zip .
      - name: Create GitHub release
        uses: softprops/action-gh-release@v1
        with:
          files: pocketlink.zip
```

## Anti-Patterns

❌ **Forgetting to update all version locations**
```
# BAD: manifest.json says 1.2.0 but CHANGELOG says 1.1.0
```

❌ **Vague changelog entries**
```markdown
# BAD
- Fixed bug
- Updated code

# GOOD
- Fixed clipboard copy failing on pages with strict CSP
- Updated offscreen document lifecycle to prevent memory leaks
```

❌ **Including development files in release**
```bash
# BAD: Includes node_modules, test files
zip -r release.zip .

# GOOD: Only extension folder
cd extension && zip -r ../release.zip .
```

## Version: 1.0.0
## References: CHANGELOG.md, extension/manifest.json
