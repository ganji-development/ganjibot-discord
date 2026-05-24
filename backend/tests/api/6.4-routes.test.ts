import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const ROUTES_DIR = resolve(BACKEND_DIR, 'src/api/routes');

describe('REST Routes', () => {
    describe('Auth Routes', () => {
        it('should have auth.ts', () => {
            expect(existsSync(resolve(ROUTES_DIR, 'auth.ts'))).toBe(true);
        });

        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(ROUTES_DIR, 'auth.ts'), 'utf-8');
        });

        it('should export authRouter', () => {
            expect(authSource).toContain('export { router as authRouter }');
        });

        it('should have /discord route', () => {
            expect(authSource).toContain("router.get('/discord'");
        });

        it('should have /discord/callback route', () => {
            expect(authSource).toContain("router.get('/discord/callback'");
        });

        it('should have /me route', () => {
            expect(authSource).toContain("router.get('/me'");
        });

        it('should have /logout route', () => {
            expect(authSource).toContain("router.post('/logout'");
        });
    });

    describe('Guilds Routes', () => {
        it('should have guilds.ts', () => {
            expect(existsSync(resolve(ROUTES_DIR, 'guilds.ts'))).toBe(true);
        });

        let guildsSource: string;

        beforeAll(() => {
            guildsSource = readFileSync(resolve(ROUTES_DIR, 'guilds.ts'), 'utf-8');
        });

        it('should export guildsRouter', () => {
            expect(guildsSource).toContain('guildsRouter');
        });

        it('should use auth middleware', () => {
            expect(guildsSource).toContain('requireAuth');
        });
    });

    describe('Addons Routes', () => {
        it('should have addons.ts', () => {
            expect(existsSync(resolve(ROUTES_DIR, 'addons.ts'))).toBe(true);
        });

        let addonsSource: string;

        beforeAll(() => {
            addonsSource = readFileSync(resolve(ROUTES_DIR, 'addons.ts'), 'utf-8');
        });

        it('should export addonsRouter', () => {
            expect(addonsSource).toContain('addonsRouter');
        });
    });
});

describe('API Middleware', () => {
    const MIDDLEWARE_DIR = resolve(BACKEND_DIR, 'src/api/middleware');

    describe('Auth Middleware', () => {
        it('should have auth.ts', () => {
            expect(existsSync(resolve(MIDDLEWARE_DIR, 'auth.ts'))).toBe(true);
        });

        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(MIDDLEWARE_DIR, 'auth.ts'), 'utf-8');
        });

        it('should export requireAuth middleware', () => {
            expect(authSource).toContain('requireAuth');
        });

        it('should verify JWT tokens', () => {
            expect(authSource).toContain('jwt.verify');
        });
    });

    describe('Error Handler', () => {
        it('should have errorHandler.ts', () => {
            expect(existsSync(resolve(MIDDLEWARE_DIR, 'errorHandler.ts'))).toBe(true);
        });

        let handlerSource: string;

        beforeAll(() => {
            handlerSource = readFileSync(resolve(MIDDLEWARE_DIR, 'errorHandler.ts'), 'utf-8');
        });

        it('should export errorHandler', () => {
            expect(handlerSource).toContain('export const errorHandler');
        });

        it('should handle errors', () => {
            expect(handlerSource).toContain('error');
        });

        it('should return JSON response', () => {
            expect(handlerSource).toContain('.json(');
        });
    });

    describe('Rate Limiter', () => {
        it('should have rateLimit.ts', () => {
            expect(existsSync(resolve(MIDDLEWARE_DIR, 'rateLimit.ts'))).toBe(true);
        });

        let limitSource: string;

        beforeAll(() => {
            limitSource = readFileSync(resolve(MIDDLEWARE_DIR, 'rateLimit.ts'), 'utf-8');
        });

        it('should export standardRateLimit', () => {
            expect(limitSource).toContain('standardRateLimit');
        });

        it('should export strictRateLimit', () => {
            expect(limitSource).toContain('strictRateLimit');
        });
    });

    describe('Access Control', () => {
        it('should have accessControl.ts', () => {
            expect(existsSync(resolve(MIDDLEWARE_DIR, 'accessControl.ts'))).toBe(true);
        });

        let accessSource: string;

        beforeAll(() => {
            accessSource = readFileSync(resolve(MIDDLEWARE_DIR, 'accessControl.ts'), 'utf-8');
        });

        it('should export getUserAccessLevel', () => {
            expect(accessSource).toContain('getUserAccessLevel');
        });

        it('should export can object', () => {
            expect(accessSource).toContain('export const can');
        });

        it('should support ADMIN level', () => {
            expect(accessSource).toContain('ADMIN');
        });

        it('should support MODERATOR level', () => {
            expect(accessSource).toContain('MODERATOR');
        });

        it('should support VIEWER level', () => {
            expect(accessSource).toContain('VIEWER');
        });
    });
});
