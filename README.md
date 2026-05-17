# Electron React SerialPort Boilerplate

A pared-down Electron + React desktop template that wires up the device-management patterns from [node-serialport-tutorial](https://github.com/Dardin-dale/node-serialport-tutorial) into a runnable app. Read the tutorial first if you want the why; this repo is the how.

## Stack

- Electron 38 + React 19 + Vite (via [electron-vite](https://electron-vite.org/))
- TypeScript across main, preload, and renderer
- Material UI for the renderer (sx prop styling, no per-component CSS files)
- `serialport` v13 for hardware, `SerialPortMock` for tests and dev mocks
- `p-queue` v8 for per-device command serialization
- Vitest for the device-layer test suite

## Quickstart

```
npm install
npm run dev
```

Dev mode auto-mocks two fake devices (`/dev/mock-a`, `/dev/mock-b`) with a fake-firmware harness so the patterns are visible immediately. `mock-a` flips unresponsive at 8s and recovers at 18s so the liveness path shows in the UI.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | electron-vite dev server with HMR for the renderer |
| `npm run build` | Production bundle of main, preload, renderer into `out/` |
| `npm run dist` | Production bundle + electron-builder installer in `release-builds/` |
| `npm run test` | Vitest run (device layer, no Electron runtime required) |
| `npm run typecheck` | TypeScript check across main, preload, renderer |

## Example device protocol

`myDevice` and the bundled fake firmware speak this ASCII protocol:

| Host writes | Device replies | Meaning |
|---|---|---|
| `!LED,0\r` or `!LED,1\r` | `!ACK,LED,<arg>;<CRC>\r` | Turn LED off / on |
| `!GET,<PARAM>\r` | `!ACK,GET,<value>;<CRC>\r` | Read a stored parameter |
| `!SET,<PARAM>,<value>\r` | `!ACK,SET,<value>;<CRC>\r` | Write a parameter to RAM |
| `!CAL,1,1\r` | `!ACK,CAL,1;<CRC>\r` | Commit pending parameters to non-volatile memory |
| anything else | `!NACK;<CRC>\r` | Unsupported command |

CRC is IBM CRC-16 over the body (excluding the trailing `\r`). The fake firmware in `src/main/device/fakeFirmware.ts` validates the round trip end-to-end against the same algorithm the client uses. If your real device speaks something different, replace the methods on `myDevice` and adjust the validator.

## Swapping mock for real hardware

The dev-mode mock setup lives in `src/main/index.ts`. To target a real device:

1. Set `myDevice.VID` and `myDevice.PID` in `src/main/device/myDevice/index.ts` to your device's USB identifiers.
2. Replace the methods on `myDevice` to match your device's protocol.
3. Remove the `SerialPortMock.binding.createPort(...)` calls in the dev-mode block if you don't want mocks alongside real hardware.

`DeviceManager`, `setAsyncInterval`, the polling loop, and the IPC bridge are device-agnostic. Anything with the right shape (static `VID`/`PID`, constructor `(path, SerialPortClass, { onDisconnect })`, a `queue` property, a `close()` method) plugs into the manager unchanged.

## Architecture

```
src/
  main/             Electron main process
    index.ts          App entry, polling loop, IPC handlers
    device/
      DeviceManager.ts
      AsyncInterval.ts
      fakeFirmware.ts   Dev-mode mock binding (drop for prod)
      myDevice/
        index.ts        Sample device protocol class
        parameters.ts   Per-parameter validators
  preload/
    index.ts          contextBridge bindings exposed on window.api
    types.ts          Api interface, shared with renderer for type-safety
  renderer/
    index.tsx         Mount + ThemeProvider
    Home.tsx          Live device table
```

Main runs two `setAsyncInterval` loops: enumeration every 2s, polling every 1s. Each tick the polling loop calls `device.ping()` then `device.poll()` and pushes snapshots to the renderer via `webContents.send('device-updated', ...)`. The renderer subscribes through `window.api` (typed via `Api` in `src/preload/types.ts`).

Failed liveness pings put the path into a 5s cooldown (`lostUntil` map) and `manager.update(filter)` skips it for that window so enumeration doesn't immediately re-add a stuck port.

## Windows build prerequisites

`serialport` ships a native binding (`@serialport/bindings-cpp`). It uses prebuilt binaries when available; if the pinned Electron version matches one of the published prebuilds, no compilation is needed. This template pins Electron to v38 specifically so prebuilts apply on first install.

If you bump Electron and prebuilts haven't shipped for that version yet, `npm install` will fall back to compiling the binding, which needs:

- **Python 3.12+**
- **Visual Studio 2022 Build Tools** with the "Desktop development with C++" workload — note: NOT Visual Studio 2025 (VS18). MSVC 2025 fails to compile Electron's cppgc headers with `__builtin_frame_address: identifier not found`. Pin to 2022 until upstream catches up.

The Node `.msi` installer from nodejs.org has an "Automatically install the necessary tools" checkbox that installs Python and MSVC together — easiest path on a clean Windows machine.

Quick workaround if a fresh install hangs on the rebuild and you want prebuilt binaries instead:

```powershell
npm pkg delete scripts.postinstall
npm install
npm pkg set scripts.postinstall="electron-builder install-app-deps"
```

Don't commit the `npm pkg delete` change; it's local only.

## WSL note

WSLg can't reliably display Electron windows even with the GPU-disabled workaround in `src/main/index.ts`. If you're on WSL and the dev window doesn't appear, develop the renderer in a browser at `http://localhost:5173` (Vite serves it directly) and run the actual Electron app from a Windows or native-Linux/macOS environment. Cross-building a Windows installer from WSL also needs `wine32:i386` for the resource-patching step; building from a Windows host is simpler.

## What this template intentionally doesn't include

Common Electron app features that are out of scope here. Add them in your fork as needed:

- **Code signing** (Windows EV cert, Apple Developer ID), required for distribution without security prompts
- **Auto-update** (electron-updater + a publish target like GitHub releases)
- **Crash reporting** (Sentry, BugSnag, etc.)
- **Settings persistence** across runs (electron-store, sqlite, etc.)
- **Multi-window**, custom native menus, system tray
- **Routing** (`react-router-dom` for more than one page)
- **Linting / formatting** (ESLint + Prettier; pick your preferred config)
- **CI workflow** (GitHub Actions, etc.)

The pattern surface (`DeviceManager`, `setAsyncInterval`, IPC bridge) doesn't change based on which of these you add.

## License

MIT
