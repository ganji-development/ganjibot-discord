/**
 * Channel Command Tests
 * Tests for Phase 4.2: Channel Management Commands
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { channelCommand } from '../../src/bot/commands/channel.js';
import { SlashCommandBuilder } from 'discord.js';

describe('Channel Command', () => {
    it('should export channelCommand', () => {
        expect(channelCommand).toBeDefined();
    });

    it('should have correct name and description', () => {
        expect(channelCommand.data.name).toBe('channel');
        expect(channelCommand.data.description).toContain('Manage guild channels');
    });

    it('should have "add" subcommand', () => {
        const data = channelCommand.data as any; // Cast because subcommands handling in types is tricky
        const options = data.options;
        const addSub = options.find((opt: any) => opt.name === 'add');
        
        expect(addSub).toBeDefined();
        expect(addSub.description).toContain('Create');
        
        const nameOpt = addSub.options.find((opt: any) => opt.name === 'name');
        const typeOpt = addSub.options.find((opt: any) => opt.name === 'type');
        const categoryOpt = addSub.options.find((opt: any) => opt.name === 'category');
        
        expect(nameOpt).toBeDefined();
        expect(nameOpt.required).toBe(true);
        
        expect(typeOpt).toBeDefined();
        expect(typeOpt.required).toBe(true);
        expect(typeOpt.choices).toBeDefined();
        
        expect(categoryOpt).toBeDefined();
    });

    it('should have "edit" subcommand', () => {
        const data = channelCommand.data as any;
        const editSub = data.options.find((opt: any) => opt.name === 'edit');
        
        expect(editSub).toBeDefined();
        expect(editSub.description).toContain('Edit');
        
        const channelOpt = editSub.options.find((opt: any) => opt.name === 'channel');
        expect(channelOpt).toBeDefined();
        expect(channelOpt.required).toBe(true);
    });

    it('should have "remove" subcommand', () => {
        const data = channelCommand.data as any;
        const removeSub = data.options.find((opt: any) => opt.name === 'remove');
        
        expect(removeSub).toBeDefined();
        
        const channelOpt = removeSub.options.find((opt: any) => opt.name === 'channel');
        expect(channelOpt).toBeDefined();
        expect(channelOpt.required).toBe(true);
    });

    it('should have "move" subcommand', () => {
        const data = channelCommand.data as any;
        const moveSub = data.options.find((opt: any) => opt.name === 'move');
        
        expect(moveSub).toBeDefined();
        
        const channelOpt = moveSub.options.find((opt: any) => opt.name === 'channel');
        const posOpt = moveSub.options.find((opt: any) => opt.name === 'position');
        
        expect(channelOpt).toBeDefined();
        expect(posOpt).toBeDefined();
    });

    it('should define execute function', () => {
        expect(typeof channelCommand.execute).toBe('function');
    });

    describe('Execution Logic', () => {
        const mockReply = vi.fn();
        const mockEditReply = vi.fn();
        const mockDeferReply = vi.fn();
        const mockCreateChannel = vi.fn();
        const mockEditChannel = vi.fn();
        const mockDeleteChannel = vi.fn();
        const mockFetchChannel = vi.fn();
        
        const mockGuild = {
            channels: {
                create: mockCreateChannel,
                fetch: mockFetchChannel,
            }
        };

        const mockInteraction = {
            reply: mockReply,
            deferReply: mockDeferReply,
            editReply: mockEditReply,
            guild: mockGuild,
            deferred: false, // Initial state
            options: {
                getSubcommand: vi.fn(),
                getString: vi.fn(),
                getInteger: vi.fn(),
                getChannel: vi.fn(),
            }
        } as any;

        beforeEach(() => {
            vi.clearAllMocks();
            mockInteraction.deferred = false;
            
            // Mock deferReply to update deferred state
            mockDeferReply.mockImplementation(async () => {
                mockInteraction.deferred = true;
            });
            
            mockCreateChannel.mockResolvedValue({ 
                id: '123', 
                toString: () => '<#123>'
            });
            mockFetchChannel.mockResolvedValue({
                id: '456',
                name: 'test-channel',
                isThread: () => false,
                isDMBased: () => false,
                edit: mockEditChannel,
                delete: mockDeleteChannel,
                toString: () => '<#456>'
            });
        });

        it('should execute "add" subcommand', async () => {
            mockInteraction.options.getSubcommand.mockReturnValue('add');
            mockInteraction.options.getString.mockReturnValue('new-channel');
            mockInteraction.options.getInteger.mockReturnValue(0); // Text
            mockInteraction.options.getChannel.mockImplementation((name: string) => {
                if (name === 'category') return null;
                return { id: 'some-channel' };
            });

            await channelCommand.execute(mockInteraction);

            expect(mockDeferReply).toHaveBeenCalled();
            expect(mockCreateChannel).toHaveBeenCalledWith({
                name: 'new-channel',
                type: 0,
            });
            expect(mockEditReply).toHaveBeenCalledWith(expect.stringContaining('Created channel'));
        });

        it('should execute "edit" subcommand', async () => {
            mockInteraction.options.getSubcommand.mockReturnValue('edit');
            mockInteraction.options.getChannel.mockReturnValue({ id: '456' });
            mockInteraction.options.getString.mockImplementation((name: string) => {
                if (name === 'name') return 'updated-name';
                return null;
            });

            await channelCommand.execute(mockInteraction);

            expect(mockFetchChannel).toHaveBeenCalledWith('456');
            expect(mockEditChannel).toHaveBeenCalledWith({ name: 'updated-name' });
            expect(mockEditReply).toHaveBeenCalledWith(expect.stringContaining('Updated channel'));
        });

        it('should execute "remove" subcommand', async () => {
            mockInteraction.options.getSubcommand.mockReturnValue('remove');
            mockInteraction.options.getChannel.mockReturnValue({ id: '456' });

            await channelCommand.execute(mockInteraction);

            expect(mockFetchChannel).toHaveBeenCalledWith('456');
            expect(mockDeleteChannel).toHaveBeenCalled();
            expect(mockEditReply).toHaveBeenCalledWith(expect.stringContaining('Deleted channel'));
        });

        it('should execute "move" subcommand', async () => {
            mockInteraction.options.getSubcommand.mockReturnValue('move');
            mockInteraction.options.getInteger.mockReturnValue(5); // position
            mockInteraction.options.getChannel.mockImplementation((name: string) => {
                if (name === 'channel') return { id: '456' };
                if (name === 'category') return null; // No new category
                return null;
            });

            await channelCommand.execute(mockInteraction);

            expect(mockEditChannel).toHaveBeenCalledWith({ position: 5 });
            expect(mockEditReply).toHaveBeenCalledWith(expect.stringContaining('Moved channel'));
        });
        
        it('should handle errors gracefully', async () => {
             mockInteraction.options.getSubcommand.mockReturnValue('add');
             mockCreateChannel.mockRejectedValue(new Error('Discord Error'));
             
             await channelCommand.execute(mockInteraction);
             
             expect(mockEditReply).toHaveBeenCalledWith(expect.stringContaining('Error: Discord Error'));
        });
    });
});
