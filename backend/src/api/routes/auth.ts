/**
 * Authentication Routes
 * Discord OAuth2 flow
 */

import { Router, type IRouter } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { createLogger } from '../../logging/index.js';
import { prisma } from '../../database/index.js';
import { strictRateLimit } from '../middleware/rateLimit.js';

const logger = createLogger('api:auth');
const router: IRouter = Router();

// Apply strict rate limiting to auth routes
router.use(strictRateLimit);

const DISCORD_API = 'https://discord.com/api/v10';

/**
 * Redirect to Discord OAuth2 authorization
 */
router.get('/discord', (req, res) => {
    const params = new URLSearchParams({
        client_id: config.discord.clientId,
        redirect_uri: `${config.api.baseUrl}/api/auth/discord/callback`,
        response_type: 'code',
        scope: 'identify guilds',
    });

    res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

/**
 * Handle Discord OAuth2 callback
 */
router.get('/discord/callback', async (req, res) => {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
        res.status(400).json({ error: 'Missing authorization code' });
        return;
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: config.discord.clientId,
                client_secret: config.discord.clientSecret,
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${config.api.baseUrl}/api/auth/discord/callback`,
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            logger.error({ error }, 'Failed to exchange code for tokens');
            res.status(401).json({ error: 'Failed to authenticate with Discord' });
            return;
        }

        const tokens = (await tokenResponse.json()) as {
            access_token: string;
            refresh_token: string;
            expires_in: number;
        };

        // Get user info
        const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`,
            },
        });

        if (!userResponse.ok) {
            res.status(401).json({ error: 'Failed to get user info' });
            return;
        }

        const user = (await userResponse.json()) as {
            id: string;
            username: string;
            discriminator: string;
            avatar: string | null;
        };

        // Store session in database
        const session = await prisma.session.create({
            data: {
                userId: user.id,
                accessToken: tokens.access_token, // TODO: Encrypt
                refreshToken: tokens.refresh_token, // TODO: Encrypt
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            },
        });

        // Create JWT token
        const signOptions: jwt.SignOptions = {};
        if (config.jwt.expiresIn) {
            // expiresIn always has a default value in config schema ('7d')
            signOptions.expiresIn = config.jwt.expiresIn as unknown as NonNullable<jwt.SignOptions['expiresIn']>;
        }
        const jwtToken = jwt.sign(
            {
                userId: user.id,
                sessionId: session.id,
            },
            config.jwt.secret,
            signOptions
        );

        logger.info({ userId: user.id }, 'User authenticated');

        // Redirect to dashboard with token
        res.redirect(`${config.dashboard.url}/auth/callback?token=${jwtToken}`);
    } catch (error) {
        logger.error({ error }, 'OAuth callback error');
        res.status(500).json({ error: 'Authentication failed' });
    }
});

/**
 * Get current user info
 */
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization header' });
        return;
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, config.jwt.secret) as {
            userId: string;
            sessionId: string;
        };

        // Get session
        const session = await prisma.session.findUnique({
            where: { id: payload.sessionId },
        });

        if (!session || session.expiresAt < new Date()) {
            res.status(401).json({ error: 'Session expired' });
            return;
        }

        // Get user info from Discord
        const userResponse = await fetch(`${DISCORD_API}/users/@me`, {
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
            },
        });

        if (!userResponse.ok) {
            res.status(401).json({ error: 'Failed to get user info' });
            return;
        }

        const user = await userResponse.json();
        res.json(user);
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

/**
 * Logout - invalidate session
 */
router.post('/logout', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization header' });
        return;
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, config.jwt.secret) as {
            sessionId: string;
        };

        await prisma.session.delete({
            where: { id: payload.sessionId },
        });

        res.json({ success: true });
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export { router as authRouter };
