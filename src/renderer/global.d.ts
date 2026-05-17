import type { Api } from '../preload/types.js';

declare global {
    interface Window {
        api: Api;
    }
}

export {};
