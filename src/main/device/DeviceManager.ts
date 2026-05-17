import { SerialPort } from 'serialport';
import type PQueue from 'p-queue';

interface PortInfo {
    path: string;
    vendorId?: string;
    productId?: string;
    [key: string]: unknown;
}

interface ManagedDevice {
    queue: PQueue;
    close(): Promise<void>;
}

interface DeviceClass<D extends ManagedDevice> {
    new (
        path: string,
        SerialPortClass: typeof SerialPort,
        options: { onDisconnect?: () => void },
    ): D;
    readonly VID: string;
    readonly PID: string;
}

export interface DeviceManagerOptions {
    SerialPortClass?: typeof SerialPort;
}

export class DeviceManager<D extends ManagedDevice> {
    readonly DeviceClass: DeviceClass<D>;
    readonly SerialPortClass: typeof SerialPort;
    readonly devices: Map<string, D>;

    constructor(DeviceClass: DeviceClass<D>, { SerialPortClass = SerialPort }: DeviceManagerOptions = {}) {
        this.DeviceClass = DeviceClass;
        this.SerialPortClass = SerialPortClass;
        this.devices = new Map();
    }

    /**
     * Reconcile the device map with the current OS port list.
     *
     * @param filter Optional predicate applied after the VID/PID match.
     *   Returning false treats the port as unplugged for this tick
     *   (e.g. paths inside a liveness cooldown).
     */
    async update(filter?: (port: PortInfo) => boolean): Promise<void> {
        const allPorts = (await this.SerialPortClass.list()) as PortInfo[];
        const matching = allPorts.filter(
            (p) => p.vendorId === this.DeviceClass.VID && p.productId === this.DeviceClass.PID,
        );
        const candidates = filter ? matching.filter(filter) : matching;
        const matchingPaths = new Set(candidates.map((p) => p.path));

        for (const path of matchingPaths) {
            if (!this.devices.has(path)) {
                const device = new this.DeviceClass(path, this.SerialPortClass, {
                    onDisconnect: () => this._handleDisconnect(path),
                });
                this.devices.set(path, device);
            }
        }

        for (const path of this.devices.keys()) {
            if (!matchingPaths.has(path)) {
                await this.devices.get(path)!.close();
                this.devices.delete(path);
            }
        }
    }

    getDevices(): string[] {
        return [...this.devices.keys()];
    }

    getDevice(path: string): D | undefined {
        return this.devices.get(path);
    }

    async resetPort(path: string): Promise<void> {
        const device = this.devices.get(path);
        if (!device) return;
        await device.close();
        this.devices.delete(path);
    }

    async shutdown(): Promise<void> {
        await Promise.allSettled(
            [...this.devices.values()].map(async (device) => {
                await device.queue.onIdle();
                await device.close();
            }),
        );
        this.devices.clear();
    }

    private _handleDisconnect(path: string): void {
        // OS already closed the handle; just drop the map entry.
        this.devices.delete(path);
    }
}
