# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.0.3](https://github.com/Maximilian94/latamv-monorepo/compare/v1.0.1...v1.0.3) (2025-08-03)


### Features

* make flight entity independent from route with eet field ([#11](https://github.com/Maximilian94/latamv-monorepo/issues/11)) ([019316e](https://github.com/Maximilian94/latamv-monorepo/commit/019316e097364480c576079f5ffc55b5716d9ff4))
* remove flight-aircraft relation and add aircraft model field ([#12](https://github.com/Maximilian94/latamv-monorepo/issues/12)) ([24fb7e7](https://github.com/Maximilian94/latamv-monorepo/commit/24fb7e7454a69ef2161016f5969376e48bc2b276))

### [1.0.2](https://github.com/Maximilian94/latamv-monorepo/compare/v1.0.1...v1.0.2) (2025-08-02)


### Features

* make flight entity independent from route with eet field ([#11](https://github.com/Maximilian94/latamv-monorepo/issues/11)) ([019316e](https://github.com/Maximilian94/latamv-monorepo/commit/019316e097364480c576079f5ffc55b5716d9ff4))

### 1.0.1 (2025-08-02)


### Features

* flight duty generation ([fc0fb01](https://github.com/Maximilian94/latamv-monorepo/commit/fc0fb01a0736d990645bf3cd1af6cc1890e66e56))
* implement automated semver versioning system ([b0a3e76](https://github.com/Maximilian94/latamv-monorepo/commit/b0a3e7652ba3b1a41bb278aa6dd2c095ccd182b7))
* implement automatic Pilot role assignment and comprehensive tests ([#10](https://github.com/Maximilian94/latamv-monorepo/issues/10)) ([3cba7f8](https://github.com/Maximilian94/latamv-monorepo/commit/3cba7f82d0fce0bd721d8de1e0372373b89b8472))
* implement pilot base system with multiple airports per base ([ea99d11](https://github.com/Maximilian94/latamv-monorepo/commit/ea99d1182f1e88caf86a9851b353d409097c8948))
* test automated versioning system ([1646e5d](https://github.com/Maximilian94/latamv-monorepo/commit/1646e5dc05f051be35518e8a6d572fc8b2e1ace5))


### Bug Fixes

* add ensure_bases_exist migration with correct structure ([58860b0](https://github.com/Maximilian94/latamv-monorepo/commit/58860b0a934bf192a1a9f556640f150a26007632))
* build error ([aa13d41](https://github.com/Maximilian94/latamv-monorepo/commit/aa13d415a181c41ee6ad3763a2b6254a70b7be0f))
* move base creation to correct migration for proper deployment sequence ([ffdb26a](https://github.com/Maximilian94/latamv-monorepo/commit/ffdb26aba2a5994f6ecc8d7e8c1f49fd33e9dff1))
* prevent infinite loop in versioning workflow ([d30ff14](https://github.com/Maximilian94/latamv-monorepo/commit/d30ff145a38aaa70b5d89c278ef81093f780be87))
* remove dependency between workflow jobs for direct pushes ([c4c7f9f](https://github.com/Maximilian94/latamv-monorepo/commit/c4c7f9f0178a92924c5b83ec71e31bf6cd1db68f))
* resolve production migration issue for base system ([86c08e3](https://github.com/Maximilian94/latamv-monorepo/commit/86c08e3662156fb7cc6effdccb57d6277bb3f30c))
* use personal access token for workflow permissions ([f448cde](https://github.com/Maximilian94/latamv-monorepo/commit/f448cde767129a291165ccbc752b7e87c3d63e8f))

## [1.0.0] - 2024-01-01

### Added
- Initial release of LATAM Virtual application
- Frontend React application with Material-UI
- Backend NestJS API with Prisma ORM
- Authentication system
- Flight management features
- Weather integration
- Real-time updates via WebSocket 