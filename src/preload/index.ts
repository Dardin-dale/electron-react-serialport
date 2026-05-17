import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { Api, DeviceLost, DeviceUpdate } from './types.js';

function subscribe<T>(channel: string, cb: (data: T) => void): () => void {
    const handler = (_event: IpcRendererEvent, data: T) => cb(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
}

const api: Api = {
    getDevices: () => ipcRenderer.invoke('get-devices'),
    onDevicesChanged: (cb) => subscribe<string[]>('devices-changed', cb),
    onDeviceUpdated: (cb) => subscribe<DeviceUpdate>('device-updated', cb),
    onDeviceLost: (cb) => subscribe<DeviceLost>('device-lost', cb),
    ledOn: (path) => ipcRenderer.invoke('led-on', path),
    ledOff: (path) => ipcRenderer.invoke('led-off', path),
};

contextBridge.exposeInMainWorld('api', api);
