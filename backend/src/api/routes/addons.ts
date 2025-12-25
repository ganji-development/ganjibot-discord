/**
 * Addon Routes
 * REST API for addon management
 */

import { Router, type IRouter } from 'express';
import { createLogger } from '../../logging/index.js';
import { prisma } from '../../database/index.js';
import { requireAuth } from '../middleware/auth.js';
import { authenticatedRateLimit } from '../middleware/rateLimit.js';

const logger = createLogger('api:addons');
const router: IRouter = Router();

// Apply auth and rate limiting to all addon routes
router.use(requireAuth);
router.use(authenticatedRateLimit);

/**
 * Get all available addons
 */
router.get('/', async (req, res) => {
    const addons = await prisma.addon.findMany();
    res.json(addons);
});

/**
 * Get a specific addon
 */
router.get('/:id', async (req, res) => {
    const addon = await prisma.addon.findUnique({
        where: { id: req.params.id },
    });

    if (!addon) {
        res.status(404).json({ error: 'Addon not found' });
        return;
    }

    res.json(addon);
});

/**
 * Get addons installed for a guild
 */
router.get('/guild/:guildId', async (req, res) => {
    const guildAddons = await prisma.guildAddon.findMany({
        where: { guildId: req.params.guildId },
        include: { addon: true },
    });

    res.json(guildAddons);
});

/**
 * Install an addon for a guild
 */
router.post('/guild/:guildId/:addonId', async (req, res) => {
    const { guildId, addonId } = req.params;

    // Check if addon exists
    const addon = await prisma.addon.findUnique({
        where: { id: addonId },
    });

    if (!addon) {
        res.status(404).json({ error: 'Addon not found' });
        return;
    }

    // Check if already installed
    const existing = await prisma.guildAddon.findUnique({
        where: {
            guildId_addonId: { guildId, addonId },
        },
    });

    if (existing) {
        res.status(409).json({ error: 'Addon already installed' });
        return;
    }

    const guildAddon = await prisma.guildAddon.create({
        data: {
            guildId,
            addonId,
            enabled: false,
            config: {},
        },
        include: { addon: true },
    });

    logger.info({ guildId, addonId }, 'Addon installed');
    res.status(201).json(guildAddon);
});

/**
 * Uninstall an addon from a guild
 */
router.delete('/guild/:guildId/:addonId', async (req, res) => {
    const { guildId, addonId } = req.params;

    try {
        await prisma.guildAddon.delete({
            where: {
                guildId_addonId: { guildId, addonId },
            },
        });

        logger.info({ guildId, addonId }, 'Addon uninstalled');
        res.json({ success: true });
    } catch {
        res.status(404).json({ error: 'Addon not installed for this guild' });
    }
});

/**
 * Enable an addon for a guild
 */
router.post('/guild/:guildId/:addonId/enable', async (req, res) => {
    const { guildId, addonId } = req.params;

    try {
        const guildAddon = await prisma.guildAddon.update({
            where: {
                guildId_addonId: { guildId, addonId },
            },
            data: { enabled: true },
            include: { addon: true },
        });

        logger.info({ guildId, addonId }, 'Addon enabled');
        res.json(guildAddon);
    } catch {
        res.status(404).json({ error: 'Addon not installed for this guild' });
    }
});

/**
 * Disable an addon for a guild
 */
router.post('/guild/:guildId/:addonId/disable', async (req, res) => {
    const { guildId, addonId } = req.params;

    try {
        const guildAddon = await prisma.guildAddon.update({
            where: {
                guildId_addonId: { guildId, addonId },
            },
            data: { enabled: false },
            include: { addon: true },
        });

        logger.info({ guildId, addonId }, 'Addon disabled');
        res.json(guildAddon);
    } catch {
        res.status(404).json({ error: 'Addon not installed for this guild' });
    }
});

/**
 * Update addon configuration for a guild
 */
router.patch('/guild/:guildId/:addonId/config', async (req, res) => {
    const { guildId, addonId } = req.params;
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
        res.status(400).json({ error: 'Invalid config' });
        return;
    }

    try {
        const guildAddon = await prisma.guildAddon.update({
            where: {
                guildId_addonId: { guildId, addonId },
            },
            data: { config },
            include: { addon: true },
        });

        logger.info({ guildId, addonId }, 'Addon config updated');
        res.json(guildAddon);
    } catch {
        res.status(404).json({ error: 'Addon not installed for this guild' });
    }
});

export { router as addonsRouter };
