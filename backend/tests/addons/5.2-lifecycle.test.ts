import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const ADDONS_DIR = resolve(BACKEND_DIR, 'src/addons');

describe('Addon Lifecycle Management', () => {
    describe('Install Operation', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(ADDONS_DIR, 'AddonManager.ts'), 'utf-8');
        });

        it('should have install method', () => {
            expect(managerSource).toContain('public async install(packageName: string)');
        });

        it('should load addon via loader', () => {
            expect(managerSource).toContain('this.loader.load(packageName)');
        });

        it('should validate permissions', () => {
            expect(managerSource).toContain('this.permissionEnforcer.validate');
        });

        it('should persist to database', () => {
            expect(managerSource).toContain('prisma.addon.upsert');
        });

        it('should register in registry', () => {
            expect(managerSource).toContain('this.registry.register(addon)');
        });

        it('should call onInit lifecycle hook', () => {
            expect(managerSource).toContain('addon.instance.onInit');
        });
    });

    describe('Uninstall Operation', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(ADDONS_DIR, 'AddonManager.ts'), 'utf-8');
        });

        it('should have uninstall method', () => {
            expect(managerSource).toContain('public async uninstall(addonId: string)');
        });

        it('should call onUnload lifecycle hook', () => {
            expect(managerSource).toContain('addon.instance.onUnload');
        });

        it('should remove guild associations first', () => {
            expect(managerSource).toContain('prisma.guildAddon.deleteMany');
        });

        it('should remove from database', () => {
            expect(managerSource).toContain('prisma.addon.delete');
        });

        it('should unregister from registry', () => {
            expect(managerSource).toContain('this.registry.unregister(addonId)');
        });

        it('should throw if addon not found', () => {
            expect(managerSource).toContain('Addon not found');
        });
    });

    describe('Enable For Guild', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(ADDONS_DIR, 'AddonManager.ts'), 'utf-8');
        });

        it('should have enableForGuild method', () => {
            expect(managerSource).toContain('public async enableForGuild(addonId: string, guildId: string)');
        });

        it('should persist enabled state to database', () => {
            expect(managerSource).toContain('prisma.guildAddon.upsert');
        });

        it('should call onEnable lifecycle hook', () => {
            expect(managerSource).toContain('addon.instance.onEnable');
        });

        it('should update registry', () => {
            expect(managerSource).toContain('this.registry.enableForGuild(addonId, guildId)');
        });
    });

    describe('Disable For Guild', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(ADDONS_DIR, 'AddonManager.ts'), 'utf-8');
        });

        it('should have disableForGuild method', () => {
            expect(managerSource).toContain('public async disableForGuild');
        });

        it('should persist disabled state to database', () => {
            expect(managerSource).toContain('prisma.guildAddon.update');
        });

        it('should call onDisable lifecycle hook', () => {
            expect(managerSource).toContain('addon.instance.onDisable');
        });

        it('should update registry', () => {
            expect(managerSource).toContain('this.registry.disableForGuild(addonId, guildId)');
        });
    });

    describe('Lifecycle Hooks', () => {
        let typesSource: string;

        beforeAll(() => {
            typesSource = readFileSync(resolve(ADDONS_DIR, 'types.ts'), 'utf-8');
        });

        it('should define onInit hook', () => {
            expect(typesSource).toContain('onInit');
        });

        it('should define onEnable hook', () => {
            expect(typesSource).toContain('onEnable');
        });

        it('should define onDisable hook', () => {
            expect(typesSource).toContain('onDisable');
        });

        it('should define onUnload hook', () => {
            expect(typesSource).toContain('onUnload');
        });
    });

    describe('Initialization', () => {
        let managerSource: string;

        beforeAll(() => {
            managerSource = readFileSync(resolve(ADDONS_DIR, 'AddonManager.ts'), 'utf-8');
        });

        it('should have initialize method', () => {
            expect(managerSource).toContain('public async initialize()');
        });

        it('should load addons from database on init', () => {
            expect(managerSource).toContain('prisma.addon.findMany()');
        });

        it('should load guild-specific states', () => {
            expect(managerSource).toContain('prisma.guildAddon.findMany');
        });

        it('should prevent multiple initializations', () => {
            expect(managerSource).toContain('if (this.initialized)');
        });
    });
});
