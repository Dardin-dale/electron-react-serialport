import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { SerialPortMock } from 'serialport';
import { DeviceManager } from './DeviceManager.js';
import { myDevice } from './myDevice/index.js';
import { FakeFirmwarePort, setFakeDeviceState } from './fakeFirmware.js';

const mockOpts = { SerialPortClass: FakeFirmwarePort as unknown as typeof SerialPortMock };

describe('DeviceManager', () => {
    beforeEach(() => {
        SerialPortMock.binding.reset();
    });

    afterEach(() => {
        SerialPortMock.binding.reset();
    });

    test('update() picks up only ports matching the device class VID/PID', async () => {
        SerialPortMock.binding.createPort('/match', { vendorId: myDevice.VID, productId: myDevice.PID });
        SerialPortMock.binding.createPort('/other', { vendorId: '1234', productId: '5678' });
        setFakeDeviceState('/match', { params: { FW_VERSION: '1.0.0' } });

        const manager = new DeviceManager(myDevice, mockOpts as never);
        await manager.update();

        expect(manager.getDevices()).toEqual(['/match']);
        await manager.shutdown();
    });

    test('update() drops devices whose path disappears from SerialPort.list', async () => {
        SerialPortMock.binding.createPort('/a', { vendorId: myDevice.VID, productId: myDevice.PID });
        SerialPortMock.binding.createPort('/b', { vendorId: myDevice.VID, productId: myDevice.PID });
        setFakeDeviceState('/a', { params: { FW_VERSION: '1.0.0' } });
        setFakeDeviceState('/b', { params: { FW_VERSION: '1.0.0' } });

        const manager = new DeviceManager(myDevice, mockOpts as never);
        await manager.update();
        expect(manager.getDevices()).toContain('/a');
        expect(manager.getDevices()).toContain('/b');

        SerialPortMock.binding.reset();
        SerialPortMock.binding.createPort('/b', { vendorId: myDevice.VID, productId: myDevice.PID });
        await manager.update();

        expect(manager.getDevices()).toEqual(['/b']);
        await manager.shutdown();
    });

    test('update(filter) treats filtered paths as if unplugged', async () => {
        SerialPortMock.binding.createPort('/a', { vendorId: myDevice.VID, productId: myDevice.PID });
        SerialPortMock.binding.createPort('/b', { vendorId: myDevice.VID, productId: myDevice.PID });
        setFakeDeviceState('/a', { params: { FW_VERSION: '1.0.0' } });
        setFakeDeviceState('/b', { params: { FW_VERSION: '1.0.0' } });

        const manager = new DeviceManager(myDevice, mockOpts as never);
        await manager.update((port) => port.path !== '/a');

        expect(manager.getDevices()).toEqual(['/b']);
        await manager.shutdown();
    });

    test('getDevice returns the live instance, undefined for unknown paths', async () => {
        SerialPortMock.binding.createPort('/a', { vendorId: myDevice.VID, productId: myDevice.PID });
        setFakeDeviceState('/a', { params: { FW_VERSION: '1.0.0' } });

        const manager = new DeviceManager(myDevice, mockOpts as never);
        await manager.update();

        expect(manager.getDevice('/a')).toBeDefined();
        expect(manager.getDevice('/missing')).toBeUndefined();

        await manager.shutdown();
    });
});
