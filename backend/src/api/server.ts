/**
 * API Server
 * Express server with REST routes and GraphQL endpoint
 */

import express, { type Express, type Request } from 'express';
import type { Server } from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';

import { config } from '../config/index.js';
import { createLogger } from '../logging/index.js';
import { prisma } from '../database/index.js';
import type { GanjibotClient } from '../bot/index.js';
import type { AddonManager } from '../addons/index.js';

import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { authRouter } from './routes/auth.js';
import { guildsRouter } from './routes/guilds.js';
import { addonsRouter } from './routes/addons.js';
import { errorHandler } from './middleware/errorHandler.js';
import { standardRateLimit } from './middleware/rateLimit.js';

const logger = createLogger('api:server');

export interface ApiContext {
    prisma: typeof prisma;
    client: GanjibotClient;
    addonManager: AddonManager;
    userId?: string;
    sessionId?: string;
}

/**
 * Create, configure, and start the Express API server
 */
export async function createApiServer(
    client: GanjibotClient,
    addonManager: AddonManager,
    port: number
): Promise<Server> {
    const app = express();

    // Security middleware
    // Security middleware
    const helmetOptions = config.env === 'production' ? {} : { contentSecurityPolicy: false };
    app.use(helmet(helmetOptions));

    // CORS configuration
    app.use(
        cors({
            origin: config.dashboard.url,
            credentials: true,
        })
    );

    // Body parsing
    app.use(express.json());

    // Health check endpoint (no auth required)
    app.get('/health', (req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version ?? '0.0.0',
        });
    });

    // Apply standard rate limiting to all API routes
    app.use('/api', standardRateLimit);

    // REST API routes
    app.use('/api/auth', authRouter);
    app.use('/api/guilds', guildsRouter);
    app.use('/api/addons', addonsRouter);

    // GraphQL server
    const apolloServer = new ApolloServer<ApiContext>({
        typeDefs,
        resolvers,
    });

    await apolloServer.start();
    logger.info('GraphQL server started');

    // Mount GraphQL endpoint
    app.use(
        '/graphql',
        expressMiddleware(apolloServer, {
            context: async ({ req }: { req: Request }): Promise<ApiContext> => {
                let userId: string | undefined;
                let sessionId: string | undefined;

                // Extract user from JWT token if present
                const authHeader = req.headers.authorization;
                if (authHeader?.startsWith('Bearer ')) {
                    try {
                        const token = authHeader.slice(7);
                        const payload = jwt.verify(token, config.jwt.secret) as {
                            userId: string;
                            sessionId: string;
                        };
                        userId = payload.userId;
                        sessionId = payload.sessionId;
                    } catch {
                        // Invalid token - continue without userId
                    }
                }

                return {
                    prisma,
                    client,
                    addonManager,
                    ...(userId !== undefined && { userId }),
                    ...(sessionId !== undefined && { sessionId }),
                };
            },
        })
    );

    // Error handling middleware (must be last)
    app.use(errorHandler);

    // Start the server and return the http.Server instance
    const server = app.listen(port, () => {
        logger.info(`API server listening on port ${port}`);
    });

    return server;
}
