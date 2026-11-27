# DA Manager v1.1.0 — DirectAdmin Desktop App

Electron + React + TypeScript app for managing DirectAdmin through the legacy `CMD_API_*` API.

## Features

- Overview, Domains, Subdomains, Emails, Databases, FTP
- File Manager: browse, create, upload, download, edit, rename, copy and delete
- Admin / Reseller: list users, create users, edit disk/bandwidth quotas, suspend, activate and delete users
- Automatic role detection (user / reseller / admin)
- Change password (Settings)
- Per-session TLS opt-in for self-signed certificates
- Credentials stay in main-process memory only; never written to disk and never returned to the renderer
- Modern dark UI
- Vitest unit tests and ESLint checks

## Quick Start (Development)

```bash
npm install
npm run electron:dev
```

## Build Windows .exe

### On Windows (recommended)

1. Install [Node.js 18+](https://nodejs.org/)
2. Open a terminal in this folder:

```bash
npm install
npm run dist
```

After the build, files appear in `release/`:

- **DA Manager-1.1.0-Portable.exe** — portable app
- **DA Manager-1.1.0-Windows-x64.exe** — NSIS installer

### On Linux / macOS (cross-build)

```bash
npm install
npx electron-builder --win --x64 --publish never
```

Some Linux setups need `wine` for Windows signing or installer tooling.

## Login

All fields are editable in the login screen.

- URL: `https://122.154.34.166:2222`
- Username: `freehost2611014`
- Password: your DirectAdmin password
- Self-signed certificate: tick only for servers you trust

## Scripts

| Command | Description |
|---------|-------------|
| `npm run electron:dev` | Run development mode |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint check |
| `npm test` | Run Vitest unit tests |
| `npm run build` | Build renderer + Electron main |
| `npm run dist` | Build Windows Portable .exe |
| `npm run dist:win` | Build Portable + NSIS installer |
| `npm run dist:linux` | Build Linux AppImage |

## CI / Release

`.github/workflows/build-exe.yml` runs lint, tests and builds on every push/PR. Pushing a `v*` tag creates a GitHub Release with the Windows EXEs and Linux AppImage. The build steps use `--publish never` so only the dedicated release job uploads assets.

# friendly-pancake
