# LATAM Virtual Application

A comprehensive virtual airline management system built with React frontend and NestJS backend.

## 🚀 Features

- **Flight Management**: Complete flight planning and tracking system

## 📦 Version Management

This project uses automated Semantic Versioning (SemVer) with the following features:

### Version Display
- **Frontend**: Version chip in footer with detailed tooltip
- **Backend**: `/version` endpoint returning version information
- **Automatic Sync**: All packages maintain consistent versioning

### Versioning Commands
```bash
# Patch version (bug fixes) - 1.0.0 → 1.0.1
npm run version:patch

# Minor version (new features) - 1.0.0 → 1.1.0
npm run version:minor

# Major version (breaking changes) - 1.0.0 → 2.0.0
npm run version:major

# Create release with git push
npm run release
```

### Development Scripts
```bash
# Format all code with Prettier
npm run format

# Build frontend (lint + build)
npm run build:fe

# Build backend
npm run build:be

# Run all build checks before push
npm run prepush-checks

# Generate changelog from conventional commits
npm run changelog

# Sync versions across all packages manually
npm run version:sync
```

### What Each Script Does

#### 🏗️ Build Scripts
- **`format`**: Runs Prettier to format all code files in the project
- **`build:fe`**: Lints and builds the frontend React application
- **`build:be`**: Builds the backend NestJS application
- **`prepush-checks`**: Runs both frontend and backend builds to ensure everything works before pushing

#### 🔄 Versioning Scripts
- **`version:patch`**: 
  - Analyzes commits and bumps PATCH version (1.0.0 → 1.0.1)
  - Updates CHANGELOG.md with new changes
  - Creates Git tag (v1.0.1)
  - Syncs version across all packages

- **`version:minor`**: 
  - Forces MINOR version bump (1.0.0 → 1.1.0) regardless of commit types
  - Same process as patch but for new features

- **`version:major`**: 
  - Forces MAJOR version bump (1.0.0 → 2.0.0) for breaking changes
  - Same process as patch but for breaking changes

- **`version:update`**: 
  - Core script that runs standard-version
  - Analyzes conventional commits to determine version type
  - Updates package.json, CHANGELOG.md, and creates Git tags

- **`version:sync`**: 
  - Runs the sync-versions.js script
  - Updates version in frontend/package.json and backend/package.json
  - Creates version.json files for both frontend and backend

- **`changelog`**: 
  - Generates CHANGELOG.md from conventional commits
  - Useful for manual changelog generation

- **`release`**: 
  - Complete release workflow
  - Runs version:patch + git push with tags
  - Triggers GitHub Actions for automated release

- **`test:scripts`**: 
  - Runs tests for the version sync script
  - Validates script functionality and error handling

### Conventional Commits
The project follows [Conventional Commits](https://www.conventionalcommits.org/) for automatic changelog generation:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build process or auxiliary tool changes

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation
```bash
# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd backend && npm install
```

### Development Scripts
```bash
# Start frontend development server
cd frontend && npm run dev

# Start backend development server
cd backend && npm run start:dev

# Build both applications
npm run build:fe && npm run build:be

# Run tests
cd backend && npm run test

# Run script tests
npm run test:scripts
```

## 🔧 Configuration

### Environment Variables
Create `.env` files in both `frontend/` and `backend/` directories:

**Backend (.env)**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-jwt-secret"
NODE_ENV="development"
```

**Frontend (.env)**
```env
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000"
```

## 📋 API Documentation

The backend API documentation is available at `/api` when running in development mode.

### Version Endpoint
- `GET /version` - Returns current application version information

## 🤝 Contributing

1. Follow the conventional commits format
2. Create feature branches from `develop`
3. Submit pull requests to `main`
4. Ensure all tests pass
5. Update documentation as needed

## 📄 License

This project is proprietary software for LATAM Virtual.

## 🔄 CI/CD

The project includes GitHub Actions workflows for:
- Automated versioning on main branch pushes
- Conventional commit validation
- Automatic changelog generation
- Release creation with tags 