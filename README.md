# Electron React SerialPort Boilerplate

A pared-down Electron + React desktop template that wires up the device-management patterns from [node-serialport-tutorial](https://github.com/Dardin-dale/node-serialport-tutorial) into a runnable app. Read the tutorial first if you want the why; this repo is the how.

## Stack

- Electron 42 + React 19 + Vite (via [electron-vite](https://electron-vite.org/))
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

## Swapping mock for real hardware

The dev-mode mock setup lives in `src/main/index.ts`. To target a real device:

1. Set `myDevice.VID` and `myDevice.PID` in `src/main/device/myDevice/index.ts` to your device's USB identifiers.
2. Replace the methods in `myDevice` to match your device's protocol. The example uses an ASCII `!CMD,arg\r` / `!ACK,CMD,VALUE;CRC\r` shape; yours will differ.
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

## WSL note

WSLg can't reliably display Electron windows even with the GPU-disabled workaround in `src/main/index.ts`. If the dev window doesn't appear, develop the renderer in a browser at `http://localhost:5173` (Vite serves it directly) and run the actual Electron app from a Windows or native-Linux/macOS environment.

## License

MIT
