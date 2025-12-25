/**
 * Event Dispatcher
 * Routes Discord events to core handlers and addon handlers
 */

import type { Client, ClientEvents } from 'discord.js';
import { createLogger } from '../logging/index.js';
import type { AddonManager } from '../addons/index.js';

const logger = createLogger('bot:events');

type EventHandler<E extends keyof ClientEvents> = (
    ...args: ClientEvents[E]
) => Promise<void> | void;

interface RegisteredHandler<E extends keyof ClientEvents> {
    handler: EventHandler<E>;
    priority: number;
    source: string; // 'core' or addon ID
}

/**
 * Dispatches Discord events to registered handlers
 * Supports priority-based ordering and error isolation
 */
export class EventDispatcher {
    private readonly client: Client;
    private readonly addonManager: AddonManager;
    private readonly handlers: Map<
        keyof ClientEvents,
        RegisteredHandler<keyof ClientEvents>[]
    > = new Map();

    constructor(client: Client, addonManager: AddonManager) {
        this.client = client;
        this.addonManager = addonManager;
    }

    /**
     * Register a handler for a Discord event
     */
    public register<E extends keyof ClientEvents>(
        event: E,
        handler: EventHandler<E>,
        options: { priority?: number; source?: string } = {}
    ): void {
        const { priority = 0, source = 'core' } = options;

        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
            this.setupEventListener(event);
        }

        const handlers = this.handlers.get(event)!;
        handlers.push({
            handler: handler as EventHandler<keyof ClientEvents>,
            priority,
            source,
        });

        // Sort by priority (higher priority first)
        handlers.sort((a, b) => b.priority - a.priority);

        logger.debug({ event, source, priority }, 'Registered event handler');
    }

    /**
     * Unregister all handlers from a specific source (e.g., addon ID)
     */
    public unregisterBySource(source: string): void {
        for (const [event, handlers] of this.handlers.entries()) {
            const filtered = handlers.filter((h) => h.source !== source);
            if (filtered.length !== handlers.length) {
                this.handlers.set(event, filtered);
                logger.debug(
                    { event, source, removed: handlers.length - filtered.length },
                    'Unregistered event handlers'
                );
            }
        }
    }

    /**
     * Set up the Discord.js event listener for an event
     */
    private setupEventListener<E extends keyof ClientEvents>(event: E): void {
        this.client.on(event, async (...args: ClientEvents[E]) => {
            const handlers = this.handlers.get(event) ?? [];

            for (const { handler, source } of handlers) {
                try {
                    await handler(...args);
                } catch (error) {
                    logger.error(
                        { error, event, source },
                        'Error in event handler'
                    );
                    // Continue to next handler - errors are isolated
                }
            }
        });
    }

    /**
     * Get registered handlers for an event (for debugging/inspection)
     */
    public getHandlers(
        event: keyof ClientEvents
    ): readonly RegisteredHandler<keyof ClientEvents>[] {
        return this.handlers.get(event) ?? [];
    }
}
