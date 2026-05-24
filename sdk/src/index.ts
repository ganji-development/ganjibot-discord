/**
 * Ganjibot Addon SDK
 * Type definitions and interfaces for developing addons
 */

import type { ChatInputCommandInteraction, ClientEvents } from 'discord.js';
import type { Request, Response } from 'express';

/**
 * Addon command definition
 */
export interface AddonCommand {
    name: string;
    description: string;
    options?: AddonCommandOption[];
    handler: (interaction: ChatInputCommandInteraction, context: AddonContext) => Promise<void>;
}

/**
 * Command option definition
 */
export interface AddonCommandOption {
    name: string;
    description: string;
    type: 'string' | 'integer' | 'boolean' | 'user' | 'channel' | 'role';
    required?: boolean;
    choices?: Array<{ name: string; value: string | number }>;
}

/**
 * Addon event listener definition
 */
export interface AddonEventListener<
    E extends keyof ClientEvents = keyof ClientEvents,
> {
    event: E;
    priority?: number;
    handler: (context: AddonContext, ...args: ClientEvents[E]) => Promise<void>;
}

/**
 * Addon HTTP route definition
 */
export interface AddonHTTPRoute {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    handler: (req: Request, res: Response, context: AddonContext) => Promise<void>;
}

/**
 * Addon permission declarations
 */
export interface AddonPermissions {
    commands?: string[];
    events?: string[];
    http?: string[];
    database?: boolean;
    secrets?: boolean;
}

/**
 * Context provided to addon handlers
 */
export interface AddonContext {
    /**
     * ID of the guild where the action is occurring
     * (null for global events or non-guild HTTP requests)
     */
    guildId: string | null;

    /**
     * Addon configuration for this guild
     */
    config: Record<string, unknown>;

    /**
     * Logger instance scoped to this addon/guild
     */
    logger: {
        info(obj: object, msg?: string): void;
        info(msg: string, ...args: any[]): void;
        warn(obj: object, msg?: string): void;
        warn(msg: string, ...args: any[]): void;
        error(obj: object, msg?: string): void;
        error(msg: string, ...args: any[]): void;
        debug(obj: object, msg?: string): void;
        debug(msg: string, ...args: any[]): void;
    };

    /**
     * Key-value store for addon data
     */
    storage: {
        get<T>(key: string): Promise<T | null>;
        set<T>(key: string, value: T): Promise<void>;
        delete(key: string): Promise<void>;
    };
}

/**
 * Addon interface that addon packages must implement
 */
export interface Addon {
    name: string;
    version: string;
    author: string;
    description: string;
    permissions?: AddonPermissions;

    // Lifecycle hooks
    onInit?(): Promise<void>;
    onEnable?(guildId: string): Promise<void>;
    onDisable?(guildId: string): Promise<void>;
    onUnload?(): Promise<void>;

    // Registration methods
    commands?(): AddonCommand[];
    eventListeners?(): AddonEventListener[];
    httpRoutes?(): AddonHTTPRoute[];
}

/**
 * Addon manifest (built from addon properties + package info)
 */
export interface AddonManifest {
    id: string; // NPM package name
    name: string;
    version: string;
    author: string;
    description: string;
    homepage?: string;
    permissions: AddonPermissions;
    commands: AddonCommand[];
    eventListeners: AddonEventListener[];
    httpRoutes: AddonHTTPRoute[];
}

/**
 * Loaded addon with instance and manifest
 */
export interface LoadedAddon {
    id: string;
    instance: Addon;
    manifest: AddonManifest;
}
