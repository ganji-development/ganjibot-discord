import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const PROJECT_ROOT = resolve(BACKEND_DIR, '..');

interface PackageJson {
    name: string;
    version: string;
    type?: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts?: Record<string, string>;
}

describe('Backend Dependencies', () => {
    let packageJson: PackageJson;

    beforeAll(() => {
        const packagePath = resolve(BACKEND_DIR, 'package.json');
        const content = readFileSync(packagePath, 'utf-8');
        packageJson = JSON.parse(content) as PackageJson;
    });

    describe('Package Configuration', () => {
        it('should be an ES module', () => {
            expect(packageJson.type).toBe('module');
        });

        it('should have a valid version', () => {
            expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
        });
    });

    describe('Core Dependencies', () => {
        const requiredDeps = [
            '@apollo/server',
            '@prisma/client',
            'discord.js',
            'express',
            'graphql',
            'jsonwebtoken',
            'pino',
            'zod',
            'cors',
            'dotenv',
        ];

        it.each(requiredDeps)('should have %s installed', (dep) => {
            expect(packageJson.dependencies).toHaveProperty(dep);
        });
    });

    describe('Dev Dependencies', () => {
        const requiredDevDeps = ['typescript', 'vitest', 'prisma', 'tsx', '@types/node'];

        it.each(requiredDevDeps)('should have %s as dev dependency', (dep) => {
            expect(packageJson.devDependencies).toHaveProperty(dep);
        });
    });

    describe('NPM Scripts', () => {
        const requiredScripts = ['dev', 'build', 'start', 'test', 'db:generate', 'db:push'];

        it.each(requiredScripts)('should have %s script', (script) => {
            expect(packageJson.scripts).toHaveProperty(script);
        });
    });
});

describe('Frontend Dependencies', () => {
    let packageJson: PackageJson;

    beforeAll(() => {
        const packagePath = resolve(PROJECT_ROOT, 'frontend/package.json');
        const content = readFileSync(packagePath, 'utf-8');
        packageJson = JSON.parse(content) as PackageJson;
    });

    describe('Core Dependencies', () => {
        const requiredDeps = ['react', 'react-dom', 'react-router-dom', '@apollo/client', 'graphql'];

        it.each(requiredDeps)('should have %s installed', (dep) => {
            expect(packageJson.dependencies).toHaveProperty(dep);
        });
    });

    describe('Dev Dependencies', () => {
        const requiredDevDeps = ['typescript', 'vite', '@vitejs/plugin-react'];

        it.each(requiredDevDeps)('should have %s as dev dependency', (dep) => {
            expect(packageJson.devDependencies).toHaveProperty(dep);
        });
    });
});

describe('Environment Configuration', () => {
    it('should have .env.example file', () => {
        expect(existsSync(resolve(BACKEND_DIR, '.env.example'))).toBe(true);
    });

    it('.env.example should contain required variables', () => {
        const envExample = readFileSync(resolve(BACKEND_DIR, '.env.example'), 'utf-8');
        const requiredVars = [
            'DISCORD_TOKEN',
            'DISCORD_CLIENT_ID',
            'DISCORD_CLIENT_SECRET',
            'DATABASE_HOST',
            'DATABASE_PORT',
            'DATABASE_NAME',
            'DATABASE_USER',
            'JWT_SECRET',
        ];

        for (const varName of requiredVars) {
            expect(envExample).toContain(varName);
        }
    });
});
