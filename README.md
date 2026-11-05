# Zucktron

I hate Facebook.

A minimal Electron wrapper that opens Facebook Messenger as a standalone desktop app, with a persistent login session across restarts.

## Prerequisites

- [Node.js](https://nodejs.org/)
- A package manager: [pnpm](https://pnpm.io/), [npm](https://www.npmjs.com/), or [bun](https://bun.sh/) all work.

## Setup

```
pnpm install   # or: npm install / bun install
```

## Development

```
pnpm start   # or: npm start / bun run start
```

Opens a window loading the URL in `MESSENGER_URL` (`main.js`). To point it at a specific conversation instead of the inbox, edit that constant.

Login persists across restarts via Electron's `persist:messenger` session partition.

## Building a standalone app

```
pnpm run build         # package for your current OS/architecture
pnpm run build:mac     # macOS, arm64 + x64
pnpm run build:win     # Windows, x64
pnpm run build:linux   # Linux, x64
```

(Substitute `npm run` / `bun run` for `pnpm run` if you're using a different package manager.)

Output goes to `dist/`. Cross-platform builds work from any host — Electron ships prebuilt per-platform binaries that `electron-packager` downloads and repackages, no native compilation involved.

Install the result:

- **macOS**: move the `.app` from `dist/` into `/Applications`.
- **Windows**: run the `.exe` from `dist/`, or copy the whole output folder wherever you want it.
- **Linux**: run the binary from the output folder, or copy it into your applications directory of choice.

These builds are unsigned, since there's no code signing set up. On another machine, macOS Gatekeeper will block the first launch (right-click the app → Open to bypass) and Windows SmartScreen will warn (click "More info" → "Run anyway").
