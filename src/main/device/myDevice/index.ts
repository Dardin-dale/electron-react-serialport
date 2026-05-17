import Params from './parameters.js';
import PQueue from 'p-queue';
import { SerialPort, ReadlineParser } from 'serialport';

export interface MyDeviceOptions {
    onDisconnect?: () => void;
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

function generateChecksum(msg: string): string {
    const withDelim = msg + ';';
    let calc = 0;
    for (let i = 0; i < withDelim.length; i++) {
        calc = computeCRC16MSB(withDelim.charCodeAt(i), calc);
    }
    return calc.toString(16).toUpperCase().padStart(4, '0');
}

function validateChecksum(msg: string, checksum: string): boolean {
    return generateChecksum(msg) === checksum;
}

export class myDevice {
    static readonly VID = '0483';
    static readonly PID = '5740';

    readonly path: string;
    readonly idle: string;
    readonly parser: ReadlineParser;
    readonly port: SerialPort;
    readonly queue: PQueue;

    constructor(
        id: string,
        SerialPortClass: typeof SerialPort = SerialPort,
        { onDisconnect }: MyDeviceOptions = {},
    ) {
        this.path = id;
        this.idle = '!STATUS,IDLE';
        this.parser = new ReadlineParser({ delimiter: '\r', encoding: 'ascii' });
        this.port = new SerialPortClass(
            { path: id, baudRate: 115200 },
            (err) => {
                if (err) throw new Error(`Unable to initiate port: ${err.message}`);
            },
        );
        this.queue = new PQueue({ concurrency: 1 });
        this.port.pipe(this.parser);
        this.port.on('close', (err: { disconnected?: boolean } | null) => {
            if (err?.disconnected && onDisconnect) onDisconnect();
        });
    }

    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.port.isOpen) return resolve();
            this.port.close((err) => (err ? reject(err) : resolve()));
        });
    }

    ledOn(): Promise<string> {
        const cmd = Buffer.from('!LED,1\r', 'ascii');
        return this.queue.add(() => this._ackCall(cmd)) as Promise<string>;
    }

    ledOff(): Promise<string> {
        const cmd = Buffer.from('!LED,0\r', 'ascii');
        return this.queue.add(() => this._ackCall(cmd)) as Promise<string>;
    }

    getParam(param: string): Promise<string> {
        const cmd = Buffer.from(`!GET,${param}\r`, 'ascii');
        return this.queue.add(() => this._ackCall(cmd)) as Promise<string>;
    }

    setParam(param: string, value: string | number): Promise<string> {
        if (!Params.isValid(param, value)) {
            return Promise.reject(`Invalid value for parameter: ${param}`);
        }
        const cmd = Buffer.from(`!SET,${param},${value}\r`, 'ascii');
        return this.queue.add(() => this._ackCall(cmd)) as Promise<string>;
    }

    saveParams(): Promise<string> {
        const cmd = Buffer.from('!CAL,1,1\r', 'ascii');
        return this.queue.add(() => this._ackCall(cmd)) as Promise<string>;
    }

    async updateParam(param: string, value: string | number): Promise<string> {
        await this.setParam(param, value);
        return this.saveParams();
    }

    /** Returns true if the device responds to a `!GET,FW_VERSION` within 1s. */
    ping(): Promise<boolean> {
        const cmd = Buffer.from('!GET,FW_VERSION\r', 'ascii');
        return (this.queue.add(() => this._ackCall(cmd, 1000)) as Promise<string>)
            .then(() => true, () => false);
    }

    /** Snapshot of values worth surfacing to a UI. */
    async poll(): Promise<{ serialNumber: string; ledDrive: string }> {
        return {
            serialNumber: await this.getParam('SERIAL_NUMBER'),
            ledDrive: await this.getParam('LED_DRIVE'),
        };
    }

    private _ackCall(cmd: Buffer, timeoutMs = 5000): Promise<string> {
        return new Promise((resolve, reject) => {
            const cleanup = () => {
                this.port.removeAllListeners('error');
            };
            this.port.once('error', (err) => {
                cleanup();
                reject(err);
            });
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error('Device timed out.'));
            }, timeoutMs);

            this.port.write(cmd, (err) => {
                if (err) {
                    clearTimeout(timer);
                    cleanup();
                    reject(err);
                }
            });

            this.parser.once('data', (data: Buffer) => {
                const msg = data.toString('ascii').split(';');
                const checksum = msg[1]?.trim() ?? '';
                const info = msg[0].split(',');
                clearTimeout(timer);
                cleanup();
                if (info[0] === '!NACK') {
                    reject(new Error(`Command: ${cmd.toString().trim()} not properly Ack'd!`));
                    return;
                }
                if (!validateChecksum(msg[0], checksum)) {
                    reject(new Error('Invalid checksum, data corrupt'));
                    return;
                }
                resolve(info[2]);
            });
        });
    }

    private _multiReceive(command: Buffer, expected: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const collected: string[] = [];
            const cleanup = () => {
                this.parser.removeAllListeners('data');
                this.port.removeAllListeners('error');
            };
            this.port.once('error', (err) => {
                cleanup();
                reject(err);
            });
            const timer = setTimeout(() => {
                cleanup();
                reject(new Error(`Device timed out. CMD: ${command.toString().trim()} failed. Path: ${this.path}`));
            }, 15000);

            this.port.write(command, (err) => {
                if (err) {
                    clearTimeout(timer);
                    cleanup();
                    reject(err);
                }
            });

            this.parser.on('data', (data: Buffer) => {
                const msg = data.toString('ascii').split(';');
                const checksum = msg[1]?.trim() ?? '';
                const info = msg[0].split(',');

                if (!validateChecksum(msg[0], checksum)) {
                    clearTimeout(timer);
                    cleanup();
                    reject(new Error(`Invalid checksum returned. received: ${msg[0]} check: ${checksum}`));
                    return;
                }

                if (info[0] === '!NACK') {
                    clearTimeout(timer);
                    cleanup();
                    reject(new Error(`Command: ${command.toString().trim()} not properly acknowledged.`));
                    return;
                }

                if (info[0] === '!ACK') return;

                if (info[0] === expected) {
                    collected.push(msg[0]);
                }

                if (msg[0] === this.idle) {
                    clearTimeout(timer);
                    cleanup();
                    resolve(collected);
                }
            });
        });
    }
}
