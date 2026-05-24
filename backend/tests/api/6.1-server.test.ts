import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const API_DIR = resolve(BACKEND_DIR, 'src/api');

describe('API Server', () => {
    describe('File Structure', () => {
        it('should have server.ts', () => {
            expect(existsSync(resolve(API_DIR, 'server.ts'))).toBe(true);
        });

        it('should have graphql directory', () => {
            expect(existsSync(resolve(API_DIR, 'graphql'))).toBe(true);
        });

        it('should have routes directory', () => {
            expect(existsSync(resolve(API_DIR, 'routes'))).toBe(true);
        });

        it('should have middleware directory', () => {
            expect(existsSync(resolve(API_DIR, 'middleware'))).toBe(true);
        });
    });

    describe('Server Setup', () => {
        let serverSource: string;

        beforeAll(() => {
            serverSource = readFileSync(resolve(API_DIR, 'server.ts'), 'utf-8');
        });

        it('should import Express', () => {
            expect(serverSource).toContain("from 'express'");
        });

        it('should export createApiServer function', () => {
            expect(serverSource).toContain('export async function createApiServer');
        });

        it('should create Express app', () => {
            expect(serverSource).toContain('const app = express()');
        });
    });

    describe('Security Middleware', () => {
        let serverSource: string;

        beforeAll(() => {
            serverSource = readFileSync(resolve(API_DIR, 'server.ts'), 'utf-8');
        });

        it('should use Helmet for security headers', () => {
            expect(serverSource).toContain("import helmet from 'helmet'");
            expect(serverSource).toContain('app.use(helmet');
        });

        it('should configure CORS', () => {
            expect(serverSource).toContain("import cors from 'cors'");
            expect(serverSource).toContain('app.use(');
            expect(serverSource).toContain('cors(');
        });

        it('should use JSON body parser', () => {
            expect(serverSource).toContain('app.use(express.json()');
        });
    });

    describe('Health Check', () => {
        let serverSource: string;

        beforeAll(() => {
            serverSource = readFileSync(resolve(API_DIR, 'server.ts'), 'utf-8');
        });

        it('should have health check endpoint', () => {
            expect(serverSource).toContain("app.get('/health'");
        });

        it('should return status in health check', () => {
            expect(serverSource).toContain("status: 'ok'");
        });
    });

    describe('Rate Limiting', () => {
        let serverSource: string;

        beforeAll(() => {
            serverSource = readFileSync(resolve(API_DIR, 'server.ts'), 'utf-8');
        });

        it('should import rate limiter', () => {
            expect(serverSource).toContain('standardRateLimit');
        });

        it('should apply rate limiting to API routes', () => {
            expect(serverSource).toContain("app.use('/api', standardRateLimit)");
        });
    });

    describe('REST Routes', () => {
        let serverSource: string;

        beforeAll(() => {
            serverSource = readFileSync(resolve(API_DIR, 'server.ts'), 'utf-8');
        });

        it('should mount auth routes', () => {
            expect(serverSource).toContain("app.use('/api/auth', authRouter)");
        });

        it('should mount guilds routes', () => {
            expect(serverSource).toContain("app.use('/api/guilds', guildsRouter)");
        });

        it('should mount addons routes', () => {
            expect(serverSource).toContain("app.use('/api/addons', addonsRouter)");
        });
    });

    describe('GraphQL Integration', () => {
        let serverSource: string;

        beforeAll(() => {
            serverSource = readFileSync(resolve(API_DIR, 'server.ts'), 'utf-8');
        });

        it('should import Apollo Server', () => {
            expect(serverSource).toContain("from '@apollo/server'");
        });

        it('should create Apollo Server', () => {
            expect(serverSource).toContain('new ApolloServer');
        });

        it('should start Apollo Server', () => {
            expect(serverSource).toContain('apolloServer.start()');
        });

        it('should mount GraphQL endpoint', () => {
            expect(serverSource).toContain("'/graphql'");
        });

        it('should use Express middleware for GraphQL', () => {
            expect(serverSource).toContain('expressMiddleware');
        });
    });

    describe('Error Handling', () => {
        let serverSource: string;

        beforeAll(() => {
            serverSource = readFileSync(resolve(API_DIR, 'server.ts'), 'utf-8');
        });

        it('should import error handler', () => {
            expect(serverSource).toContain('errorHandler');
        });

        it('should use error handler middleware', () => {
            expect(serverSource).toContain('app.use(errorHandler)');
        });
    });

    describe('API Context', () => {
        let serverSource: string;

        beforeAll(() => {
            serverSource = readFileSync(resolve(API_DIR, 'server.ts'), 'utf-8');
        });

        it('should export ApiContext interface', () => {
            expect(serverSource).toContain('export interface ApiContext');
        });

        it('should include prisma in context', () => {
            expect(serverSource).toContain('prisma: typeof prisma');
        });

        it('should include client in context', () => {
            expect(serverSource).toContain('client: GanjibotClient');
        });

        it('should include addonManager in context', () => {
            expect(serverSource).toContain('addonManager: AddonManager');
        });

        it('should include optional userId', () => {
            expect(serverSource).toContain('userId?: string');
        });

        it('should include optional sessionId', () => {
            expect(serverSource).toContain('sessionId?: string');
        });
    });
});
