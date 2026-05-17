import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        build: {
            rollupOptions: {
                input: { index: 'src/main/index.ts' },
            },
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            rollupOptions: {
                input: { index: 'src/preload/index.ts' },
                output: {
                    format: 'cjs',
                    entryFileNames: 'index.cjs',
                },
            },
        },
    },
    renderer: {
        root: 'src/renderer',
        plugins: [react()],
        build: {
            rollupOptions: {
                input: { index: 'src/renderer/index.html' },
            },
        },
    },
});
