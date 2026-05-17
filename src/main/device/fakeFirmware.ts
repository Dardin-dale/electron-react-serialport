import { SerialPortMock } from 'serialport';

interface DeviceState {
    ledOn: boolean;
    params: Record<string, string>;
    saved: boolean;
    unresponsive: boolean;
}

interface AttachOptions {
    latencyMs?: number;
}

function computeCRC16MSB(b: number, crc: number): number {
    let data = b;
    data <<= 8;
    for (let i = 0; i < 8; i++) {
        if (((data ^ crc) & 0x8000) !== 0) {
            crc = 0xffff & ((crc << 1) ^ 0x8005);
        } else {
            crc = 0xffff & (crc << 1);
        }
        data <<= 1;
    }
    return crc;
}

function checksumFor(body: string): string {
    const withDelim = body + ';';
    let calc = 0;
    for (let i = 0; i < withDelim.length; i++) {
        calc = computeCRC16MSB(withDelim.charCodeAt(i), calc);
    }
    return calc.toString(16).toUpperCase().padStart(4, '0');
}

function buildResponse(body: string): string {
    return `${body};${checksumFor(body)}\r`;
}

function makeDefaultState(): DeviceState {
    return {
        ledOn: false,
        params: {
            SERIAL_NUMBER: 'DEMO_SN_00001',
            FW_VERSION: '1.0.0',
            LED_DRIVE: '128',
        },
        saved: false,
        unresponsive: false,
    };
}

const stateByPath = new Map<string, DeviceState>();

function getOrInitState(path: string): DeviceState {
    let state = stateByPath.get(path);
    if (!state) {
        state = makeDefaultState();
        stateByPath.set(path, state);
    }
    return state;
}

export function setFakeDeviceState(
    path: string,
    overrides: Partial<Omit<DeviceState, 'params'>> & { params?: Record<string, string> } = {},
): void {
    const base = makeDefaultState();
    stateByPath.set(path, {
        ...base,
        ...overrides,
        params: { ...base.params, ...(overrides.params ?? {}) },
    });
}

export function setFakeDeviceUnresponsive(path: string, unresponsive = true): void {
    const state = getOrInitState(path);
    state.unresponsive = unresponsive;
}

export function getFakeDeviceState(path: string): DeviceState | undefined {
    const s = stateByPath.get(path);
    if (!s) return undefined;
    return { ...s, params: { ...s.params } };
}

function handleCommand(state: DeviceState, cmdStr: string): string {
    if (!cmdStr.startsWith('!')) {
        return buildResponse('!NACK');
    }
    const [head, ...args] = cmdStr.slice(1).split(',');

    switch (head) {
        case 'LED': {
            const arg = args[0];
            if (arg === '0' || arg === '1') {
                state.ledOn = arg === '1';
                return buildResponse(`!ACK,LED,${arg}`);
            }
            return buildResponse('!NACK');
        }
        case 'GET': {
            const param = args[0];
            if (param in state.params) {
                return buildResponse(`!ACK,GET,${state.params[param]}`);
            }
            return buildResponse('!NACK');
        }
        case 'SET': {
            const param = args[0];
            const value = args[1];
            if (param in state.params && value !== undefined) {
                state.params[param] = value;
                return buildResponse(`!ACK,SET,${value}`);
            }
            return buildResponse('!NACK');
        }
        case 'CAL': {
            state.saved = true;
            return buildResponse('!ACK,CAL,1');
        }
        default:
            return buildResponse('!NACK');
    }
}

function attachFakeFirmware(port: SerialPortMock, { latencyMs = 5 }: AttachOptions = {}): void {
    const state = getOrInitState(port.path);
    // The mock binding lives at port.port; we patch its write to fan out responses.
    const mock = (port as any).port;
    const originalWrite = mock.write.bind(mock);

    mock.write = async function patchedWrite(buffer: Buffer): Promise<unknown> {
        const result = await originalWrite(buffer);
        const cmdStr = buffer.toString('ascii').replace(/\r$/, '').trim();
        if (cmdStr.length > 0 && !state.unresponsive) {
            const response = handleCommand(state, cmdStr);
            setTimeout(() => {
                mock.emitData(Buffer.from(response, 'ascii'));
            }, latencyMs);
        }
        return result;
    };
}

/**
 * SerialPortMock subclass that auto-attaches the fake-firmware handler when
 * the port opens. Inject this as the `SerialPortClass` argument to myDevice
 * (or DeviceManager) in dev mode so writes get canned responses.
 */
export class FakeFirmwarePort extends SerialPortMock {
    constructor(...args: ConstructorParameters<typeof SerialPortMock>) {
        super(...args);
        this.once('open', () => attachFakeFirmware(this));
    }
}
