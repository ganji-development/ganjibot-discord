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
    Update guild settings
    """
    updateGuildSettings(id: ID!, settings: JSON!): Guild!

    """
    Update log configuration for a guild
    """
    updateLogConfig(guildId: ID!, logType: LogType!, config: LogConfigInput!): LogConfig!
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
    logConfigs: [LogConfig!]!
    createdAt: DateTime!
    updatedAt: DateTime!
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
  Log configuration for a guild
  """
  type LogConfig {
    id: ID!
    logType: LogType!
    channelId: String!
    enabled: Boolean!
    filters: JSON!
    format: JSON!
  }

  """
  Input for updating log configuration
  """
  input LogConfigInput {
    channelId: String!
    enabled: Boolean
    filters: JSON
    format: JSON
  }

  """
  Types of events that can be logged
  """
  enum LogType {
    MESSAGE_EDIT
    MESSAGE_DELETE
    MESSAGE_BULK_DELETE
    MEMBER_JOIN
    MEMBER_LEAVE
    MEMBER_UPDATE
    MEMBER_BAN
    MEMBER_UNBAN
    ROLE_CREATE
    ROLE_UPDATE
    ROLE_DELETE
    CHANNEL_CREATE
    CHANNEL_UPDATE
    CHANNEL_DELETE
    VOICE_STATE
    INVITE_CREATE
    INVITE_DELETE
    MODERATION
  }
`;
