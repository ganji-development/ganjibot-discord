import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

describe('Shard Manager', () => {
    describe('File Structure', () => {
        it('should have ShardManager.ts', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/bot/ShardManager.ts'))).toBe(true);
        });

        it('should have sharding.ts entry point', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/sharding.ts'))).toBe(true);
        });
    });

    describe('BotShardManager Class', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/ShardManager.ts'), 'utf-8');
        });

        it('should export BotShardManager class', () => {
            expect(managerSource).toContain('export class BotShardManager');
        });

        it('should import Discord.js ShardingManager', () => {
            expect(managerSource).toContain("import { ShardingManager } from 'discord.js'");
        });

        it('should use config for token', () => {
            expect(managerSource).toContain('config.discord.token');
        });

        it('should set totalShards to auto', () => {
            expect(managerSource).toContain("totalShards: 'auto'");
        });
    });

    describe('Environment Awareness', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/ShardManager.ts'), 'utf-8');
        });

        it('should detect development mode', () => {
            expect(managerSource).toContain("config.env === 'development'");
        });

        it('should use different script paths for dev/prod', () => {
            expect(managerSource).toContain("'src', 'index.ts'");
            expect(managerSource).toContain("'dist', 'index.js'");
        });

        it('should configure execArgv for TS in dev', () => {
            expect(managerSource).toContain('execArgv');
            expect(managerSource).toContain('tsx');
        });
    });

    describe('Shard Event Listeners', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/ShardManager.ts'), 'utf-8');
        });

        it('should listen for shardCreate event', () => {
            expect(managerSource).toContain("'shardCreate'");
        });

        it('should listen for shard death', () => {
            expect(managerSource).toContain("'death'");
        });

        it('should listen for shard ready', () => {
            expect(managerSource).toContain("'ready'");
        });

        it('should listen for shard disconnect', () => {
            expect(managerSource).toContain("'disconnect'");
        });

        it('should listen for shard reconnecting', () => {
            expect(managerSource).toContain("'reconnecting'");
        });
    });

    describe('Spawn Method', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/ShardManager.ts'), 'utf-8');
        });

        it('should have spawn method', () => {
            expect(managerSource).toContain('public async spawn()');
        });

        it('should call manager.spawn()', () => {
            expect(managerSource).toContain('this.manager.spawn()');
        });

        it('should handle spawn errors', () => {
            expect(managerSource).toContain('catch (error)');
        });

        it('should exit on fatal spawn error', () => {
            expect(managerSource).toContain('process.exit(1)');
        });
    });

    describe('Sharding Entry Point', () => {
        let shardingSource: string;

        beforeAll(() => {
            shardingSource = readFileSync(resolve(BACKEND_DIR, 'src/sharding.ts'), 'utf-8');
        });

        it('should import BotShardManager', () => {
            expect(shardingSource).toContain('BotShardManager');
        });

        it('should create manager instance', () => {
            expect(shardingSource).toContain('new BotShardManager');
        });

        it('should call spawn', () => {
            expect(shardingSource).toContain('.spawn()');
        });
    });
});
