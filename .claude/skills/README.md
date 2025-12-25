# PocketLink Claude Skills

This directory contains specialized Claude skills for developing and maintaining the PocketLink browser extension.

## What Are Skills?

Skills are modular instructional documents that help Claude understand domain-specific patterns, best practices, and project conventions. They enable Claude to provide more accurate, context-aware assistance.

## Available Skills

### Core Development

| Skill | Purpose | Use When |
|-------|---------|----------|
| [browser-extension-dev](browser-extension-dev.md) | Manifest V3 patterns, service worker architecture | Building extension features, understanding architecture |
| [chrome-api-patterns](chrome-api-patterns.md) | Chrome API usage (storage, messaging, clipboard) | Working with Chrome APIs, implementing browser features |
| [bitly-integration](bitly-integration.md) | Bit.ly API usage, error handling, rate limits | API calls, token management, shortening logic |

### Quality & Process

| Skill | Purpose | Use When |
|-------|---------|----------|
| [extension-testing](extension-testing.md) | Test strategies, mocking Chrome APIs | Adding tests, validating changes |
| [code-review](code-review.md) | Security, compliance, quality checklists | Reviewing PRs, auditing code |
| [debugging](debugging.md) | Troubleshooting techniques, common issues | Investigating bugs, user reports |

### Workflow

| Skill | Purpose | Use When |
|-------|---------|----------|
| [release-management](release-management.md) | Version bumping, changelog, Web Store submission | Preparing releases, publishing updates |
| [feature-implementation](feature-implementation.md) | Feature development patterns, PRD roadmap | Adding new functionality |

## How Skills Work

Skills are **loaded on demand** when relevant to the current task. They provide:

1. **Mental models** - How to think about the domain
2. **Patterns** - Proven solutions to common problems
3. **Anti-patterns** - What to avoid and why
4. **Code examples** - Working snippets from this codebase
5. **References** - Links to related files and documentation

## Skill Structure

Each skill follows a consistent format:

```markdown
# Skill Name

## Activation
When to use this skill

## Mental Model
How to think about the domain

## [Topic Sections]
Detailed guidance with code examples

## Anti-Patterns
What to avoid

## Version: X.Y.Z
## References: Related files
```

## Creating New Skills

When adding a new skill:

1. **Focus on expertise transfer** - Teach thinking, not just steps
2. **Include real examples** - Use actual code from this project
3. **Keep under 500 lines** - Concise, actionable content
4. **Add to this README** - Update the skills table

## Project Context

PocketLink is a Chromium browser extension that creates Bit.ly shortlinks from the context menu. Key characteristics:

- **Architecture**: Manifest V3 with service worker
- **Clipboard**: Three modes (offscreen, injection, popup)
- **Storage**: chrome.storage.sync for settings
- **API**: Bit.ly v4 with bearer token auth
- **Target**: Chrome Web Store distribution

## References

- [Product Requirements](../docs/PRD.md)
- [Technical Requirements](../docs/TRD.md)
- [FAQ](../docs/FAQ.md)
- [Changelog](../CHANGELOG.md)
