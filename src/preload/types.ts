export interface DeviceUpdate {
    path: string;
    serialNumber: string;
    ledDrive: string;
}

export interface DeviceLost {
    path: string;
}

/** Surface exposed on `window.api` via the preload contextBridge. */
export interface Api {
    /** Snapshot of currently-managed device paths. Use on mount to render before the first event arrives. */
    getDevices(): Promise<string[]>;

    /** Fires when the set of managed devices changes (path added or removed). Returns an unsubscribe handle. */
    onDevicesChanged(cb: (paths: string[]) => void): () => void;

    /** Fires each polling tick with a fresh snapshot of a device's state. Returns an unsubscribe handle. */
    onDeviceUpdated(cb: (update: DeviceUpdate) => void): () => void;

    /** Fires when a device fails its liveness check and is evicted. Returns an unsubscribe handle. */
    onDeviceLost(cb: (lost: DeviceLost) => void): () => void;

    ledOn(path: string): Promise<boolean>;
    ledOff(path: string): Promise<boolean>;
}
