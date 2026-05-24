import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/generated/**', 'src/**/*.d.ts'],
        },
        testTimeout: 10000,
        hookTimeout: 10000,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@bot': resolve(__dirname, './src/bot'),
            '@addons': resolve(__dirname, './src/addons'),
            '@api': resolve(__dirname, './src/api'),
            '@database': resolve(__dirname, './src/database'),
            '@logging': resolve(__dirname, './src/logging'),
            '@config': resolve(__dirname, './src/config'),
        },
    },
});
