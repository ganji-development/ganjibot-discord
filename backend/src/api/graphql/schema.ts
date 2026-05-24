/**
 * GraphQL Schema
 * Type definitions for the GraphQL API
 */

import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar JSON
  scalar DateTime

  type Query {
    """
    Get the currently authenticated user
    """
    me: User

    """
    Get a specific guild by ID
    """
    guild(id: ID!): Guild

    """
    Get all guilds the user has access to
    """
    guilds: [Guild!]!

    """
    Get a specific addon by ID
    """
    addon(id: ID!): Addon

    """
    Get all available addons
    """
    addons(installed: Boolean): [Addon!]!

    """
    Get channels for a guild
    """
    guildChannels(guildId: ID!): [GuildChannel!]!

    """
    Get categories for a guild
    """
    guildCategories(guildId: ID!): [GuildCategory!]!

    """
    Get audit logs for a guild
    """
    auditLogs(guildId: ID!, limit: Int, offset: Int): [AuditLog!]!
  }

  type Mutation {
    """
    Install an addon for a guild
    """
    installAddon(guildId: ID!, addonId: ID!): GuildAddon!

    """
    Uninstall an addon from a guild
    """
    uninstallAddon(guildId: ID!, addonId: ID!): Boolean!

    """
    Enable an addon for a guild
    """
    enableAddon(guildId: ID!, addonId: ID!): GuildAddon!

    """
    Disable an addon for a guild
    """
    disableAddon(guildId: ID!, addonId: ID!): GuildAddon!

    """
    Update addon configuration for a guild
    """
    updateAddonConfig(guildId: ID!, addonId: ID!, config: JSON!): GuildAddon!



    """
    Grant dashboard access to a user or role
    Requires OWNER access level
    """
    grantAccess(guildId: ID!, input: GrantAccessInput!): GuildAccess!

    """
    Revoke dashboard access from a user or role
    Requires OWNER access level
    """
    revokeAccess(guildId: ID!, userId: ID, roleId: ID): Boolean!

    """
    Create a new channel in a guild
    """
    createChannel(guildId: ID!, input: CreateChannelInput!): GuildChannel!

    """
    Update an existing channel
    """
    updateChannel(channelId: ID!, input: UpdateChannelInput!): GuildChannel!

    """
    Delete a channel
    """
    deleteChannel(channelId: ID!): Boolean!

    """
    Move a channel to a new position or category
    """
    moveChannel(channelId: ID!, position: Int!, parentId: String): GuildChannel!

    """
    Create a new category in a guild
    """
    createCategory(guildId: ID!, name: String!, position: Int): GuildCategory!

    """
    Update an existing category
    """
    updateCategory(categoryId: ID!, name: String, position: Int): GuildCategory!

    """
    Delete a category
    """
    deleteCategory(categoryId: ID!): Boolean!
    
    """
    Update general guild settings
    """
    updateSettings(guildId: ID!, input: UpdateSettingsInput!): Guild!

    """
    Update log configuration
    """
    updateLogConfig(guildId: ID!, input: LogConfigInput!): LogConfig!
  }

  """
  Discord user
  """
  type User {
    id: ID!
    username: String!
    discriminator: String!
    avatar: String
    guilds: [Guild!]!
  }

  """
  Discord guild (server)
  """
  type Guild {
    id: ID!
    name: String!
    icon: String
    ownerId: String!
    settings: JSON!
    addons: [GuildAddon!]!
    logConfig: LogConfig
    accessGrants: [GuildAccess!]!
    myAccessLevel: AccessLevel
    channels: [GuildChannel!]!
    categories: [GuildCategory!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  Dashboard access levels
  """
  enum AccessLevel {
    OWNER
    ADMIN
    MODERATOR
    VIEWER
  }

  """
  Dashboard access grant for a user or role
  """
  type GuildAccess {
    id: ID!
    guildId: String!
    userId: String
    roleId: String
    level: AccessLevel!
    grantedBy: String!
    createdAt: DateTime!
  }

  """
  Input for granting access
  """
  input GrantAccessInput {
    userId: ID
    roleId: ID
    level: AccessLevel!
  }

  """
  Addon package
  """
  type Addon {
    id: ID!
    name: String!
    description: String
    version: String!
    author: String
    homepage: String
    manifest: JSON!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  Addon installation for a guild
  """
  type GuildAddon {
    guild: Guild!
    addon: Addon!
    enabled: Boolean!
    config: JSON!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  Discord Guild Channel
  """
  type GuildChannel {
    id: ID!
    name: String!
    type: ChannelType!
    parentId: String
    position: Int!
    createdAt: DateTime!
  }

  """
  Discord Guild Category
  """
  type GuildCategory {
    id: ID!
    name: String!
    position: Int!
    channels: [GuildChannel!]!
    createdAt: DateTime!
  }

  """
  Discord Channel Type
  """
  enum ChannelType {
    GUILD_TEXT
    GUILD_VOICE
    GUILD_CATEGORY
    GUILD_ANNOUNCEMENT
    GUILD_FORUM
    GUILD_STAGE_VOICE
  }

  """
  Input for creating a channel
  """
  input CreateChannelInput {
    name: String!
    type: ChannelType!
    parentId: String
    position: Int
    topic: String
    nsfw: Boolean
  }

  """
  Input for updating a channel
  """
  input UpdateChannelInput {
    name: String
    parentId: String
    position: Int
    topic: String
    nsfw: Boolean
  }

  """
  Log configuration for a guild
  """
  type LogConfig {
    id: ID!
    guildId: String!
    modLogChannelId: String
    serverLogChannelId: String
    voiceLogChannelId: String
    joinLeaveLogChannelId: String
    commandLogChannelId: String
    logMessages: Boolean!
    logMembers: Boolean!
    logVoice: Boolean!
    logModeration: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  Input for updating log configuration
  """
  input LogConfigInput {
    modLogChannelId: String
    serverLogChannelId: String
    voiceLogChannelId: String
    joinLeaveLogChannelId: String
    commandLogChannelId: String
    logMessages: Boolean
    logMembers: Boolean
    logVoice: Boolean
    logModeration: Boolean
  }

  """
  Input for updating general settings
  """
  input UpdateSettingsInput {
    systemChannelId: String
    timezone: String
    locale: String
  }


  """
  Audit log entry
  """
  type AuditLog {
    id: ID!
    guildId: String!
    userId: String!
    action: String!
    target: String
    details: JSON
    createdAt: DateTime!
  }

`;
