export interface AsyncIntervalHandle {
    /** Stops further scheduling and resolves once any in-flight tick has finished. */
    cancel(): Promise<void>;
}

/**
 * Schedules `fn` on a recurring basis, awaiting each invocation before
 * scheduling the next. `intervalMs` is the gap between ticks, not a fixed
 * wall-clock period, so slow ticks stretch the interval instead of stacking.
 */
export function setAsyncInterval(fn: () => Promise<void>, intervalMs: number): AsyncIntervalHandle {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;
    let currentTick: Promise<void> | null = null;

    const tick = async (): Promise<void> => {
        if (cancelled) return;
        currentTick = (async () => {
            try {
                await fn();
            } catch (err) {
                console.error('setAsyncInterval tick failed:', err);
            }
        })();
        await currentTick;
        currentTick = null;
        if (cancelled) return;
        timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, intervalMs);

    return {
        async cancel() {
            cancelled = true;
            if (timer) clearTimeout(timer);
            if (currentTick) await currentTick;
        },
    };
}
