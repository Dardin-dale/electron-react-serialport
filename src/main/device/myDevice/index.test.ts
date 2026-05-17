import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { SerialPortMock } from 'serialport';
import { myDevice } from './index.js';
import { FakeFirmwarePort, setFakeDeviceState } from '../fakeFirmware.js';

function waitOpen(port: SerialPortMock): Promise<void> {
    return new Promise((resolve, reject) => {
        if (port.isOpen) return resolve();
        port.once('open', () => resolve());
        port.once('error', reject);
    });
}

describe('myDevice', () => {
    beforeEach(() => {
        SerialPortMock.binding.reset();
    });

    afterEach(() => {
        SerialPortMock.binding.reset();
    });

    test('getParam returns the value stored in fake firmware', async () => {
        SerialPortMock.binding.createPort('/test');
        setFakeDeviceState('/test', {
            params: { SERIAL_NUMBER: 'SN_001', LED_DRIVE: '42', FW_VERSION: '1.0.0' },
        });

        const device = new myDevice('/test', FakeFirmwarePort as unknown as typeof SerialPortMock);
        await waitOpen(device.port as unknown as SerialPortMock);

        expect(await device.getParam('SERIAL_NUMBER')).toBe('SN_001');
        expect(await device.getParam('LED_DRIVE')).toBe('42');

        await device.close();
    });

    test('queue serializes commands fired in parallel', async () => {
        SerialPortMock.binding.createPort('/test');
        setFakeDeviceState('/test', { params: { LED_DRIVE: '50', SERIAL_NUMBER: 'SN_X', FW_VERSION: '1.0.0' } });

        const device = new myDevice('/test', FakeFirmwarePort as unknown as typeof SerialPortMock);
        await waitOpen(device.port as unknown as SerialPortMock);

        const results = await Promise.all([
            device.ledOn(),
            device.getParam('LED_DRIVE'),
            device.ledOff(),
            device.getParam('LED_DRIVE'),
        ]);

        expect(results[1]).toBe('50');
        expect(results[3]).toBe('50');

        await device.close();
    });

    test('setParam rejects values outside the validator', async () => {
        SerialPortMock.binding.createPort('/test');
        setFakeDeviceState('/test', { params: { LED_DRIVE: '50', SERIAL_NUMBER: 'SN_X', FW_VERSION: '1.0.0' } });

        const device = new myDevice('/test', FakeFirmwarePort as unknown as typeof SerialPortMock);
        await waitOpen(device.port as unknown as SerialPortMock);

        await expect(device.setParam('LED_DRIVE', '999')).rejects.toMatch(/Invalid value/);

        await device.close();
    });

    test('ping resolves true when the device answers, false when unresponsive', async () => {
        SerialPortMock.binding.createPort('/responsive');
        SerialPortMock.binding.createPort('/dead');
        setFakeDeviceState('/responsive', { params: { FW_VERSION: '1.0.0' } });
        setFakeDeviceState('/dead', { params: { FW_VERSION: '1.0.0' }, unresponsive: true });

        const a = new myDevice('/responsive', FakeFirmwarePort as unknown as typeof SerialPortMock);
        const b = new myDevice('/dead', FakeFirmwarePort as unknown as typeof SerialPortMock);
        await waitOpen(a.port as unknown as SerialPortMock);
        await waitOpen(b.port as unknown as SerialPortMock);

        expect(await a.ping()).toBe(true);
        expect(await b.ping()).toBe(false);

        await a.close();
        await b.close();
    });
});
