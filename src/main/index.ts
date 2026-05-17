import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SerialPort, SerialPortMock } from 'serialport';
import { DeviceManager } from './device/DeviceManager.js';
import { myDevice } from './device/myDevice/index.js';
import { setAsyncInterval, type AsyncIntervalHandle } from './device/AsyncInterval.js';
import {
    FakeFirmwarePort,
    setFakeDeviceState,
    setFakeDeviceUnresponsive,
} from './device/fakeFirmware.js';

// WSLg's GPU forwarding crashes Chromium's GPU process. Disable the GPU
// process entirely inside WSL; native Linux/Mac/Windows are unaffected.
if (process.env.WSL_DISTRO_NAME) {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-gpu');
    app.commandLine.appendSwitch('disable-software-rasterizer');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICON = path.join(__dirname, '../../icon.png');

const DEV_MODE = !app.isPackaged;
const FAIL_COOLDOWN_MS = 5000;
const ENUMERATION_MS = 2000;
const POLL_MS = 1000;

// Dev: register two fake ports under myDevice's VID/PID so the polling loop
// has something to enumerate. Production hits real ports.
if (DEV_MODE) {
    SerialPortMock.binding.createPort('/dev/mock-a', {
        vendorId: myDevice.VID,
        productId: myDevice.PID,
    });
    SerialPortMock.binding.createPort('/dev/mock-b', {
        vendorId: myDevice.VID,
        productId: myDevice.PID,
    });
    setFakeDeviceState('/dev/mock-a', {
        params: { SERIAL_NUMBER: 'DEMO_A_0001', LED_DRIVE: '64', FW_VERSION: '1.0.0' },
    });
    setFakeDeviceState('/dev/mock-b', {
        params: { SERIAL_NUMBER: 'DEMO_B_0002', LED_DRIVE: '192', FW_VERSION: '1.0.0' },
    });
}

const manager = new DeviceManager(myDevice, {
    SerialPortClass: DEV_MODE ? (FakeFirmwarePort as unknown as typeof SerialPort) : SerialPort,
});

const lostUntil = new Map<string, number>();
let mainWindow: BrowserWindow | null = null;
let enumerationHandle: AsyncIntervalHandle | null = null;
let pollingHandle: AsyncIntervalHandle | null = null;

function broadcast(channel: string, data: unknown): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
    }
}

function startLoops(): void {
    enumerationHandle = setAsyncInterval(async () => {
        const before = manager.getDevices();
        const now = Date.now();
        for (const [p, until] of lostUntil) {
            if (now >= until) lostUntil.delete(p);
        }
        await manager.update((port) => !lostUntil.has(port.path));
        const after = manager.getDevices();
        if (before.length !== after.length || before.some((p, i) => p !== after[i])) {
            broadcast('devices-changed', after);
        }
    }, ENUMERATION_MS);

    pollingHandle = setAsyncInterval(async () => {
        const now = Date.now();
        for (const devicePath of manager.getDevices()) {
            if ((lostUntil.get(devicePath) ?? 0) > now) continue;
            const device = manager.getDevice(devicePath);
            if (!device) continue;

            const alive = await device.ping();
            if (!alive) {
                console.warn(`device ${devicePath} failed liveness check, resetting port`);
                lostUntil.set(devicePath, now + FAIL_COOLDOWN_MS);
                await manager.resetPort(devicePath);
                broadcast('device-lost', { path: devicePath });
                continue;
            }

            try {
                const snapshot = await device.poll();
                broadcast('device-updated', { path: devicePath, ...snapshot });
            } catch (err) {
                console.error(`poll failed for ${devicePath}:`, err);
            }
        }
    }, POLL_MS);

    if (DEV_MODE) {
        // Flip /dev/mock-a unresponsive then restore so the liveness path is visible.
        setTimeout(() => {
            console.log('flipping /dev/mock-a unresponsive');
            setFakeDeviceUnresponsive('/dev/mock-a', true);
        }, 8000);
        setTimeout(() => {
            console.log('restoring /dev/mock-a');
            setFakeDeviceUnresponsive('/dev/mock-a', false);
        }, 18000);
    }
}

ipcMain.handle('get-devices', () => manager.getDevices());

ipcMain.handle('led-on', async (_event, devicePath: string) => {
    const device = manager.getDevice(devicePath);
    if (!device) return false;
    try {
        await device.ledOn();
        return true;
    } catch {
        return false;
    }
});

ipcMain.handle('led-off', async (_event, devicePath: string) => {
    const device = manager.getDevice(devicePath);
    if (!device) return false;
    try {
        await device.ledOff();
        return true;
    } catch {
        return false;
    }
});

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 720,
        height: 540,
        center: true,
        show: true,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, '../preload/index.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.setIcon(ICON);

    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
        mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

async function shutdown(): Promise<void> {
    await Promise.all([
        enumerationHandle?.cancel() ?? Promise.resolve(),
        pollingHandle?.cancel() ?? Promise.resolve(),
    ]);
    await manager.shutdown();
}

app.whenReady().then(() => {
    createWindow();
    startLoops();
});

app.on('window-all-closed', async () => {
    await shutdown();
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow();
});
