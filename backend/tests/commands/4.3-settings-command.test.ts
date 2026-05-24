/**
 * Settings Command Tests
 * Tests for Phase 4.3: Settings & Configuration Commands (Interactive Menu)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { settingsCommand, isSettingsInteraction } from '../../src/bot/commands/settings.js';

// Mock the graphqlRequest function
vi.mock('../../src/bot/apiClient.js', () => ({
    graphqlRequest: vi.fn()
}));

import { graphqlRequest } from '../../src/bot/apiClient.js';

const mockedGraphqlRequest = vi.mocked(graphqlRequest);

describe('Settings Command (Interactive Menu)', () => {
    it('should export settingsCommand', () => {
        expect(settingsCommand).toBeDefined();
    });

    it('should have correct name and description', () => {
        expect(settingsCommand.data.name).toBe('settings');
        expect(settingsCommand.data.description).toContain('Configure server settings');
    });

    it('should require Administrator permissions', () => {
        const data = settingsCommand.data as any;
        expect(data.default_member_permissions).toBeDefined();
    });

    it('should have no subcommands (single interactive command)', () => {
        const data = settingsCommand.data as any;
        // No subcommands = no options array or empty options
        expect(data.options?.length ?? 0).toBe(0);
    });

    describe('isSettingsInteraction', () => {
        it('should return true for settings custom IDs', () => {
            expect(isSettingsInteraction('settings:general')).toBe(true);
            expect(isSettingsInteraction('settings:logging')).toBe(true);
            expect(isSettingsInteraction('settings:access')).toBe(true);
            expect(isSettingsInteraction('settings:back')).toBe(true);
            expect(isSettingsInteraction('settings:edit:general')).toBe(true);
            expect(isSettingsInteraction('settings:select:logtype')).toBe(true);
            expect(isSettingsInteraction('settings:modal:general')).toBe(true);
        });

        it('should return false for non-settings custom IDs', () => {
            expect(isSettingsInteraction('ticket:create')).toBe(false);
            expect(isSettingsInteraction('moderation:ban')).toBe(false);
            expect(isSettingsInteraction('other:button')).toBe(false);
        });
    });

    describe('Command Execution', () => {
        const mockReply = vi.fn();
        const mockEditReply = vi.fn();
        const mockDeferReply = vi.fn();

        const mockInteraction = {
            reply: mockReply,
            deferReply: mockDeferReply,
            editReply: mockEditReply,
            guildId: '123456789',
            user: { id: 'user123' },
        } as any;

        beforeEach(() => {
            vi.clearAllMocks();
            mockedGraphqlRequest.mockReset();
        });

        it('should show main menu with buttons on execute', async () => {
            await settingsCommand.execute(mockInteraction);

            expect(mockReply).toHaveBeenCalledWith({
                embeds: [expect.objectContaining({
                    data: expect.objectContaining({
                        title: '⚙️ Server Settings'
                    })
                })],
                components: [expect.any(Object)],
                ephemeral: true
            });
        });

        it('should reject if not in a guild', async () => {
            const noGuildInteraction = { ...mockInteraction, guildId: null };
            
            await settingsCommand.execute(noGuildInteraction);
            
            expect(mockReply).toHaveBeenCalledWith({
                content: expect.stringContaining('can only be used in a server'),
                ephemeral: true
            });
        });
    });
});
