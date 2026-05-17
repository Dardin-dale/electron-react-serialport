export interface AsyncIntervalHandle {
    cancel(): void;
}

/**
 * Schedules `fn` on a recurring basis, awaiting each invocation before
 * scheduling the next. `intervalMs` is the gap between ticks, not a fixed
 * wall-clock period, so slow ticks stretch the interval instead of stacking.
 */
export function setAsyncInterval(fn: () => Promise<void>, intervalMs: number): AsyncIntervalHandle {
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    const tick = async (): Promise<void> => {
        if (cancelled) return;
        try {
            await fn();
        } catch (err) {
            console.error('setAsyncInterval tick failed:', err);
        }
        if (cancelled) return;
        timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, intervalMs);

    return {
        cancel() {
            cancelled = true;
            if (timer) clearTimeout(timer);
        },
    };
}
