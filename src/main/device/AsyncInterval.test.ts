import { describe, expect, test } from 'vitest';
import { setAsyncInterval } from './AsyncInterval.js';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('setAsyncInterval', () => {
    test('does not overlap ticks even when fn is slower than the interval', async () => {
        let active = 0;
        let maxConcurrent = 0;
        let runs = 0;

        const handle = setAsyncInterval(async () => {
            active++;
            maxConcurrent = Math.max(maxConcurrent, active);
            await sleep(40);
            runs++;
            active--;
        }, 5);

        await sleep(200);
        await handle.cancel();

        expect(maxConcurrent).toBe(1);
        expect(runs).toBeGreaterThan(1);
    });

    test('cancel() stops scheduling further ticks', async () => {
        let count = 0;
        const handle = setAsyncInterval(async () => {
            count++;
        }, 10);

        await sleep(35);
        const beforeCancel = count;
        await handle.cancel();
        await sleep(50);

        expect(count).toBe(beforeCancel);
        expect(beforeCancel).toBeGreaterThan(0);
    });

    test('cancel() resolves only after the in-flight tick completes', async () => {
        let resolved = false;
        const handle = setAsyncInterval(async () => {
            await sleep(60);
            resolved = true;
        }, 5);

        await sleep(20);
        await handle.cancel();
        expect(resolved).toBe(true);
    });

    test('a tick that throws is logged but does not break the loop', async () => {
        let runs = 0;
        let throws = 0;

        const handle = setAsyncInterval(async () => {
            runs++;
            if (runs === 2) {
                throws++;
                throw new Error('boom');
            }
        }, 10);

        await sleep(60);
        await handle.cancel();

        expect(throws).toBe(1);
        expect(runs).toBeGreaterThanOrEqual(3);
    });
});
