/**
 * Channel Management Command
 * Create, edit, move, and delete channels
 */

import { 
    SlashCommandBuilder, 
    type ChatInputCommandInteraction, 
    PermissionFlagsBits, 
    ChannelType,
    type GuildChannel,
    type TextChannel,
    type VoiceChannel,
    type CategoryChannel
} from 'discord.js';
import type { Command } from '../CommandHandler.js';

export const channelCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Manage guild channels')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(sub => 
            sub.setName('add')
               .setDescription('Create a new channel')
               .addStringOption(opt => 
                   opt.setName('name')
                      .setDescription('Channel name')
                      .setRequired(true))
               .addIntegerOption(opt => 
                   opt.setName('type')
                      .setDescription('Channel type')
                      .setRequired(true)
                      .addChoices(
                          { name: 'Text', value: ChannelType.GuildText },
                          { name: 'Voice', value: ChannelType.GuildVoice },
                          { name: 'Category', value: ChannelType.GuildCategory },
                          { name: 'Announcement', value: ChannelType.GuildAnnouncement },
                          { name: 'Forum', value: ChannelType.GuildForum },
                          { name: 'Stage', value: ChannelType.GuildStageVoice }
                      ))
               .addChannelOption(opt => 
                   opt.setName('category')
                      .setDescription('Parent category')
                      .addChannelTypes(ChannelType.GuildCategory)))
        .addSubcommand(sub =>
            sub.setName('edit')
               .setDescription('Edit a channel')
               .addChannelOption(opt => 
                   opt.setName('channel')
                      .setDescription('The channel to edit')
                      .setRequired(true))
               .addStringOption(opt => opt.setName('name').setDescription('New name'))
               .addStringOption(opt => opt.setName('topic').setDescription('New topic')))
        .addSubcommand(sub =>
            sub.setName('remove')
               .setDescription('Delete a channel')
               .addChannelOption(opt => 
                   opt.setName('channel')
                      .setDescription('The channel to delete')
                      .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('move')
               .setDescription('Move a channel')
               .addChannelOption(opt => 
                   opt.setName('channel')
                      .setDescription('The channel to move')
                      .setRequired(true))
               .addIntegerOption(opt => opt.setName('position').setDescription('New position').setRequired(true))
               .addChannelOption(opt => 
                   opt.setName('category')
                      .setDescription('New parent category')
                      .addChannelTypes(ChannelType.GuildCategory))
               .addBooleanOption(opt =>
                   opt.setName('no_category')
                      .setDescription('Remove from any category (move to top level)'))) as any, // Cast to any to satisfy Command interface expecting regular Builder

    source: 'core',

    execute: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;

        if (!guild) {
            await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
            return;
        }

        try {
            switch (subcommand) {
                case 'add': {
                    const name = interaction.options.getString('name', true);
                    const type = interaction.options.getInteger('type', true);
                    const category = interaction.options.getChannel('category');

                    await interaction.deferReply();

                    const createData: any = {
                        name,
                        type: type as any,
                    };
                    if (category) createData.parent = category.id;

                    const channel = await guild.channels.create(createData);

                    await interaction.editReply(`✅ Created channel ${channel.toString()}`);
                    break;
                }

                case 'edit': {
                    const channel = interaction.options.getChannel('channel', true);
                    const name = interaction.options.getString('name');
                    const topic = interaction.options.getString('topic');

                    // Standard validation
                    // Can only edit guild channels we can view/manage
                    // Currently assuming bot has permissions via 'Administrator' or 'Manage Channels' role
                    
                    // We need to fetch the channel to edit it properly if it's not full structure
                    // But interaction.options.getChannel usually returns API object or GuildChannel
                    // We can cast it or use client.channels.fetch
                    
                    // Note: discord.js interaction channels might be partial
                    const fullChannel = await guild.channels.fetch(channel.id);
                    if (!fullChannel) {
                        await interaction.reply({ content: '❌ Channel not found.', ephemeral: true });
                        return;
                    }

                    if (fullChannel.isThread() || fullChannel.isDMBased()) {
                         await interaction.reply({ content: '❌ Cannot edit threads or DMs with this command.', ephemeral: true });
                         return;
                    }

                    if (!name && !topic) {
                        await interaction.reply({ content: '❌ Please provide at least one option to edit.', ephemeral: true });
                        return;
                    }
                    
                    await interaction.deferReply();

                    const editData: any = {};
                    if (name) editData.name = name;
                    if (topic) editData.topic = topic;

                    await fullChannel.edit(editData);
                    await interaction.editReply(`✅ Updated channel ${fullChannel.toString()}`);
                    break;
                }

                case 'remove': {
                    const channel = interaction.options.getChannel('channel', true);
                    
                    const fullChannel = await guild.channels.fetch(channel.id);
                     if (!fullChannel) {
                        await interaction.reply({ content: '❌ Channel not found.', ephemeral: true });
                        return;
                    }

                    await interaction.deferReply();
                    await fullChannel.delete();
                    await interaction.editReply(`✅ Deleted channel **${fullChannel.name}**`);
                    break;
                }

                case 'move': {
                    const channel = interaction.options.getChannel('channel', true);
                    const position = interaction.options.getInteger('position', true);
                    const category = interaction.options.getChannel('category');
                    const noCategory = interaction.options.getBoolean('no_category');

                    const fullChannel = await guild.channels.fetch(channel.id);
                    if (!fullChannel) {
                        await interaction.reply({ content: '❌ Channel not found.', ephemeral: true });
                        return;
                    }
                    
                    if (fullChannel.isThread() || fullChannel.isDMBased()) {
                         await interaction.reply({ content: '❌ Cannot move threads with this command.', ephemeral: true });
                         return;
                    }

                    await interaction.deferReply();

                    const editData: any = { position };
                    
                    // Handle category: explicit null to remove, category ID to move into, undefined to keep current
                    if (noCategory) {
                        editData.parent = null; // Remove from any category
                    } else if (category) {
                        editData.parent = category.id; // Move into specified category
                    }
                    // If neither, don't set parent - keeps current category

                    await fullChannel.edit(editData);
                    await interaction.editReply(`✅ Moved channel ${fullChannel.toString()}`);
                    break;
                }
            }
        } catch (error: any) {
            if (interaction.deferred) {
                await interaction.editReply(`❌ Error: ${error.message}`);
            } else {
                await interaction.reply({ content: `❌ Error: ${error.message}`, ephemeral: true });
            }
        }
    },
};
