/**
 * Addon Type Definitions
 * Shared types for the addon system
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
    handler: (interaction: ChatInputCommandInteraction) => Promise<void>;
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
    handler: (...args: ClientEvents[E]) => Promise<void>;
}

/**
 * Addon HTTP route definition
 */
export interface AddonHTTPRoute {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    handler: (req: Request, res: Response) => Promise<void>;
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
