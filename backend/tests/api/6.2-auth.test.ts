import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const API_DIR = resolve(BACKEND_DIR, 'src/api');

describe('Authentication', () => {
    describe('Auth Routes File', () => {
        it('should have auth.ts route file', () => {
            expect(existsSync(resolve(API_DIR, 'routes/auth.ts'))).toBe(true);
        });
    });

    describe('Discord OAuth2 Login', () => {
        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(API_DIR, 'routes/auth.ts'), 'utf-8');
        });

        it('should export authRouter', () => {
            expect(authSource).toContain('export { router as authRouter }');
        });

        it('should have Discord OAuth2 redirect route', () => {
            expect(authSource).toContain("router.get('/discord'");
        });

        it('should redirect to Discord authorization URL', () => {
            expect(authSource).toContain('https://discord.com/oauth2/authorize');
        });

        it('should include client_id in OAuth params', () => {
            expect(authSource).toContain('client_id: config.discord.clientId');
        });

        it('should request identify and guilds scopes', () => {
            expect(authSource).toContain("scope: 'identify guilds'");
        });
    });

    describe('OAuth2 Callback Handler', () => {
        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(API_DIR, 'routes/auth.ts'), 'utf-8');
        });

        it('should have callback route', () => {
            expect(authSource).toContain("router.get('/discord/callback'");
        });

        it('should extract authorization code from query', () => {
            expect(authSource).toContain('const { code } = req.query');
        });

        it('should exchange code for tokens', () => {
            expect(authSource).toContain('oauth2/token');
        });

        it('should get user info from Discord', () => {
            expect(authSource).toContain('users/@me');
        });
    });

    describe('JWT Issuance', () => {
        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(API_DIR, 'routes/auth.ts'), 'utf-8');
        });

        it('should import jsonwebtoken', () => {
            expect(authSource).toContain("import jwt from 'jsonwebtoken'");
        });

        it('should sign JWT token', () => {
            expect(authSource).toContain('jwt.sign(');
        });

        it('should include userId in JWT payload', () => {
            expect(authSource).toContain('userId: user.id');
        });

        it('should include sessionId in JWT payload', () => {
            expect(authSource).toContain('sessionId: session.id');
        });

        it('should use config.jwt.secret', () => {
            expect(authSource).toContain('config.jwt.secret');
        });

        it('should redirect to dashboard with token', () => {
            expect(authSource).toContain('config.dashboard.url');
            expect(authSource).toContain('token=${jwtToken}');
        });
    });

    describe('JWT Validation', () => {
        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(API_DIR, 'routes/auth.ts'), 'utf-8');
        });

        it('should verify JWT tokens', () => {
            expect(authSource).toContain('jwt.verify(');
        });

        it('should extract token from Bearer header', () => {
            expect(authSource).toContain("authHeader?.startsWith('Bearer ')");
        });

        it('should handle missing authorization header', () => {
            expect(authSource).toContain('Missing authorization header');
        });

        it('should handle invalid tokens', () => {
            expect(authSource).toContain('Invalid token');
        });
    });

    describe('Session Management', () => {
        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(API_DIR, 'routes/auth.ts'), 'utf-8');
        });

        it('should store session in database', () => {
            expect(authSource).toContain('prisma.session.create');
        });

        it('should store access token', () => {
            expect(authSource).toContain('accessToken: tokens.access_token');
        });

        it('should store refresh token', () => {
            expect(authSource).toContain('refreshToken: tokens.refresh_token');
        });

        it('should set session expiry', () => {
            expect(authSource).toContain('expiresAt:');
        });
    });

    describe('/me Endpoint', () => {
        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(API_DIR, 'routes/auth.ts'), 'utf-8');
        });

        it('should have /me route', () => {
            expect(authSource).toContain("router.get('/me'");
        });

        it('should verify session exists', () => {
            expect(authSource).toContain('prisma.session.findUnique');
        });

        it('should check session expiry', () => {
            expect(authSource).toContain('session.expiresAt < new Date()');
        });

        it('should return session expired error', () => {
            expect(authSource).toContain('Session expired');
        });
    });

    describe('Logout', () => {
        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(API_DIR, 'routes/auth.ts'), 'utf-8');
        });

        it('should have logout route', () => {
            expect(authSource).toContain("router.post('/logout'");
        });

        it('should delete session from database', () => {
            expect(authSource).toContain('prisma.session.delete');
        });

        it('should return success response', () => {
            expect(authSource).toContain('{ success: true }');
        });
    });

    describe('Auth Middleware', () => {
        it('should have auth middleware file', () => {
            expect(existsSync(resolve(API_DIR, 'middleware/auth.ts'))).toBe(true);
        });
    });

    describe('Rate Limiting', () => {
        let authSource: string;

        beforeAll(() => {
            authSource = readFileSync(resolve(API_DIR, 'routes/auth.ts'), 'utf-8');
        });

        it('should import strict rate limiter', () => {
            expect(authSource).toContain('strictRateLimit');
        });

        it('should apply rate limiting to auth routes', () => {
            expect(authSource).toContain('router.use(strictRateLimit)');
        });
    });
});
