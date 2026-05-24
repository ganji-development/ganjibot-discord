import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        target: "node24",
        chunkSizeWarningLimit: 1000,
        emptyOutDir: true,
        rollupOptions: {
        },
    },

    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5176,
        proxy: {
            '/api': {
                target: 'http://localhost:3066',
                changeOrigin: true,
            },
            '/graphql': {
                target: 'http://localhost:3066',
                changeOrigin: true,
            },
        },
    },
    optimizeDeps: {
        exclude: ['@apollo/client']
    },
    test: {
        environment: 'jsdom',
        env: {
            VITE_API_URL: 'http://localhost:3066/api'
        }
    }
});
