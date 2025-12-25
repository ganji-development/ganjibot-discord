/**
 * Guild Routes
 * REST API for guild management
 */

import { Router, type IRouter } from 'express';
import { createLogger } from '../../logging/index.js';
import { prisma } from '../../database/index.js';
import { requireAuth } from '../middleware/auth.js';
import { authenticatedRateLimit } from '../middleware/rateLimit.js';

const logger = createLogger('api:guilds');
const router: IRouter = Router();

// Apply auth and rate limiting to all guild routes
router.use(requireAuth);
router.use(authenticatedRateLimit);

/**
 * Get all guilds (for authenticated user)
 */
router.get('/', async (req, res) => {
    // TODO: Filter by user's guilds
    const guilds = await prisma.guild.findMany({
        include: {
            addons: {
                include: { addon: true },
            },
        },
    });

    res.json(guilds);
});

/**
 * Get a specific guild
 */
router.get('/:id', async (req, res) => {
    const guild = await prisma.guild.findUnique({
        where: { id: req.params.id },
        include: {
            addons: {
                include: { addon: true },
            },
            logConfigs: true,
        },
    });

    if (!guild) {
        res.status(404).json({ error: 'Guild not found' });
        return;
    }

    res.json(guild);
});

/**
 * Update guild settings
 */
router.patch('/:id/settings', async (req, res) => {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
        res.status(400).json({ error: 'Invalid settings' });
        return;
    }

    try {
        const guild = await prisma.guild.update({
            where: { id: req.params.id },
            data: { settings },
        });

        logger.info({ guildId: req.params.id }, 'Guild settings updated');
        res.json(guild);
    } catch {
        res.status(404).json({ error: 'Guild not found' });
    }
});

/**
 * Get guild log configurations
 */
router.get('/:id/logs', async (req, res) => {
    const logConfigs = await prisma.logConfig.findMany({
        where: { guildId: req.params.id },
    });

    res.json(logConfigs);
});

/**
 * Update a log configuration
 */
router.put('/:id/logs/:logType', async (req, res) => {
    const { channelId, enabled, filters, format } = req.body;

    if (!channelId) {
        res.status(400).json({ error: 'channelId is required' });
        return;
    }

    const logConfig = await prisma.logConfig.upsert({
        where: {
            guildId_logType: {
                guildId: req.params.id,
                logType: req.params.logType as any,
            },
        },
        create: {
            guildId: req.params.id,
            logType: req.params.logType as any,
            channelId,
            enabled: enabled ?? true,
            filters: filters ?? {},
            format: format ?? {},
        },
        update: {
            channelId,
            enabled,
            filters,
            format,
        },
    });

    logger.info(
        { guildId: req.params.id, logType: req.params.logType },
        'Log configuration updated'
    );
    res.json(logConfig);
});

/**
 * Delete a log configuration
 */
router.delete('/:id/logs/:logType', async (req, res) => {
    try {
        await prisma.logConfig.delete({
            where: {
                guildId_logType: {
                    guildId: req.params.id,
                    logType: req.params.logType as any,
                },
            },
        });

        logger.info(
            { guildId: req.params.id, logType: req.params.logType },
            'Log configuration deleted'
        );
        res.json({ success: true });
    } catch {
        res.status(404).json({ error: 'Log configuration not found' });
    }
});

export { router as guildsRouter };
