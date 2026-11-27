# DA Manager v1.1 — DirectAdmin Desktop App

Electron + React + TypeScript app for managing DirectAdmin.

## Features
- Overview, Domains, Subdomains, Emails, Databases, FTP
- Change password (Settings)
- Modern dark UI
- Credentials in memory only

## Quick Start (Development)

```bash
npm install
npm run electron:dev
```

## Build Windows .exe (Portable)

### On Windows (recommended)

1. Install [Node.js 18+](https://nodejs.org/)
2. Open terminal in this folder:

```bash
npm install
npm run dist
```

หลัง build เสร็จ จะได้ไฟล์ประมาณนี้ในโฟลเดอร์ `release/`:

- **DA Manager-1.1.0-win-x64.exe**  ← Portable (ไม่ต้องติดตั้ง ดับเบิลคลิกใช้ได้เลย)

ถ้าต้องการตัวติดตั้ง NSIS ด้วย:

```bash
npm run dist:win
```

### On Linux / macOS (cross-build)

```bash
npm install
npx electron-builder --win portable --x64
```

หมายเหตุ: บางเครื่อง Linux อาจต้องมี `wine` สำหรับการเซ็นชื่อหรือบางขั้นตอน

## Login

- URL: `https://122.154.34.166:2222`
- Username: `freehost2611014`
- Password: จากอีเมลของคุณ

## Scripts

| Command | Description |
|---------|-------------|
| `npm run electron:dev` | รันแบบ development |
| `npm run build` | Build frontend + electron main |
| `npm run dist` | Build Windows Portable .exe |
| `npm run dist:win` | Build Portable + NSIS installer |
| `npm run dist:linux` | Build Linux AppImage |

Enjoy!
# friendly-pancake
