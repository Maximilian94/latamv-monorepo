# Versioning Guide

This guide explains how to use the automated SemVer system in the LATAM Virtual application.

## 🎯 Overview

The project uses [Semantic Versioning](https://semver.org/) (SemVer) with automated tools to manage version numbers across all packages in the monorepo.

## 📋 Version Format

Versions follow the format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes that require migration
- **MINOR**: New features that are backward compatible
- **PATCH**: Bug fixes and minor improvements

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Make Your Changes

Follow the conventional commit format:

```bash
# For new features
git commit -m "feat: add user profile management"

# For bug fixes
git commit -m "fix: resolve login authentication issue"

# For documentation
git commit -m "docs: update API documentation"
```

### 3. Release a New Version

```bash
# For patch releases (bug fixes)
npm run version:patch

# For minor releases (new features)
npm run version:minor

# For major releases (breaking changes)
npm run version:major
```

## 🔧 Manual Versioning

### Using npm scripts

```bash
# Bump patch version (1.0.0 → 1.0.1)
npm run version:patch

# Bump minor version (1.0.0 → 1.1.0)
npm run version:minor

# Bump major version (1.0.0 → 2.0.0)
npm run version:major
```

### Using standard-version directly

```bash
# Specify exact version
npx standard-version --release-as 1.2.3

# Release as specific type
npx standard-version --release-as minor

# Prerelease versions
npx standard-version --prerelease alpha
```

## 📝 Conventional Commits

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

### Examples

```bash
# Feature
git commit -m "feat: add dark mode support"

# Bug fix
git commit -m "fix: resolve memory leak in flight tracking"

# Breaking change
git commit -m "feat!: remove deprecated API endpoints

BREAKING CHANGE: The /api/v1/flights endpoint has been removed.
Use /api/v2/flights instead."

# With scope
git commit -m "feat(auth): add two-factor authentication"
```

## 🔄 Automated Workflow

### GitHub Actions

The project includes automated workflows that:

1. **Validate commits** on pull requests
2. **Bump versions** automatically on main branch pushes
3. **Create releases** with changelog
4. **Sync versions** across all packages

### Workflow Triggers

- **Pull Requests**: Validates conventional commits
- **Main Branch Push**: Automatically bumps version and creates release

## 📊 Version Display

### Frontend

The version is displayed in the footer using the `VersionDisplay` component:

```tsx
import VersionDisplay from './components/version-display';

// Basic usage
<VersionDisplay />

// With options
<VersionDisplay 
  variant="chip" 
  showDetails={true} 
/>
```

### Backend

Version information is available via the `/version` endpoint:

```bash
curl http://localhost:3000/version
```

Response:
```json
{
  "success": true,
  "data": {
    "version": "1.2.3",
    "buildDate": "2024-01-15T10:30:00.000Z",
    "commitHash": "abc123def",
    "environment": "production"
  }
}
```

## 🛠️ Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feat/new-feature

# Make changes and commit
git add .
git commit -m "feat: implement new feature"

# Push to remote
git push origin feat/new-feature
```

### 2. Release Process

```bash
# Merge to main
git checkout main
git merge feat/new-feature

# Bump version (automated by CI/CD)
git push origin main

# Or manually
npm run version:minor
git push --follow-tags origin main
```

## 📋 Changelog

The `CHANGELOG.md` file is automatically generated based on conventional commits.

### Manual Changelog Generation

```bash
# Generate changelog
npm run changelog

# Generate changelog for specific version
npx conventional-changelog -p angular -i CHANGELOG.md -s -r 0
```

## 🔍 Troubleshooting

### Common Issues

1. **Commit rejected**: Ensure your commit follows conventional format
2. **Version not synced**: Run `npm run version:sync` manually
3. **Changelog not updated**: Check if commits follow conventional format

### Manual Fixes

```bash
# Force version sync
node scripts/sync-versions.js

# Regenerate changelog
npm run changelog

# Reset version
git tag -d v1.2.3
git push origin :refs/tags/v1.2.3
```

## 📚 Additional Resources

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [standard-version](https://github.com/conventional-changelog/standard-version)
- [commitlint](https://commitlint.js.org/) 