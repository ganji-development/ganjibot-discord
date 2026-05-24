# Ganjibot Addon SDK

The official SDK for developing addons for the Ganjibot Discord platform.

## Installation

```bash
npm install @ganjibot/addon-sdk
```

## Features

- **Type Safety**: Full TypeScript definitions for Addon API.
- **Context Awareness**: `AddonContext` provides safe access to:
  - `logger`: Scoped logging.
  - `storage`: Persistent key-value storage.
  - `config`: Guild-specific configuration.
- **Interfaces**:
  - `AddonCommand`: Define slash commands.
  - `AddonEventListener`: Listen to Discord events.
  - `AddonHTTPRoute`: Define custom API endpoints.

## Example Addon

```typescript
import { Addon, AddonContext, AddonCommand } from '@ganjibot/addon-sdk';

export default class MyAddon implements Addon {
    name = 'Ping Addon';
    version = '1.0.0';
    author = 'Ganji Dev';
    description = 'Responds to ping';

    permissions = {
        commands: ['ping'],
    };

    commands(): AddonCommand[] {
        return [
            {
                name: 'ping',
                description: 'Replies with Pong!',
                handler: async (interaction, context) => {
                    context.logger.info('Ping command received');
                    await interaction.reply('Pong!');
                }
            }
        ];
    }
}
```
