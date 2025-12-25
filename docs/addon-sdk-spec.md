# Addon SDK Spec v0.1 (TypeScript/Node.js)

## Core Concepts

- Addons are **NPM packages** that export a class or function compatible with the core's addon manager.
- Addons interact with the bot through a **well-defined SDK** (provided as a peer dependency).
- Addons can register commands, event listeners, background jobs, and HTTP endpoints.

## Addon Structure

```typescript
// addon-example/index.ts
import { Addon, Command, EventListener, HTTPRoute } from 'your-bot-sdk';

export default class ExampleAddon implements Addon {
  name = 'Example Addon';
  version = '1.0.0';
  author = 'Your Name';
  description = 'An example addon for your bot';

  // Permissions this addon requires
  permissions = {
    commands: ['example'],
    events: ['messageCreate'],
    http: ['GET /example'],
  };

  // Lifecycle hooks
  async onInit() {
    // Called once when addon is loaded
    console.log('Example addon initialized');
  }

  async onEnable() {
    // Called when addon is enabled for a guild
    console.log('Example addon enabled');
  }

  async onDisable() {
    // Called when addon is disabled for a guild
    console.log('Example addon disabled');
  }

  // Command registration
  commands(): Command[] {
    return [
      {
        name: 'example',
        description: 'Example command',
        handler: async (interaction) => {
          await interaction.reply('Hello from Example Addon!');
        },
      },
    ];
  }

  // Event listener registration
  eventListeners(): EventListener[] {
    return [
      {
        event: 'messageCreate',
        handler: async (message) => {
          if (message.content === '!ping') {
            await message.reply('Pong!');
          }
        },
      },
    ];
  }

  // HTTP route registration
  httpRoutes(): HTTPRoute[] {
    return [
      {
        method: 'GET',
        path: '/example',
        handler: async (req, res) => {
          res.json({ message: 'Hello from Example Addon!' });
        },
      },
    ];
  }
}
```

## SDK API

### Addon Interface
- `onInit()`: Called once at startup.
- `onEnable()`: Called when addon is enabled for a guild.
- `onDisable()`: Called when addon is disabled for a guild.
- `commands()`: Returns array of command definitions.
- `eventListeners()`: Returns array of event listener definitions.
- `httpRoutes()`: Returns array of HTTP route definitions.

### Command Definition
- `name`: Command name.
- `description`: Command description.
- `handler`: Function to handle command interaction.

### EventListener Definition
- `event`: Discord event name.
- `handler`: Function to handle event.

### HTTPRoute Definition
- `method`: HTTP method.
- `path`: Route path.
- `handler`: Function to handle HTTP request.

## Security & Permissions

- Addons must declare required permissions in their manifest.
- The core enforces permissions at runtime.
- Admins see a permissions summary before enabling an addon.

## Distribution

- Addons are published to NPM with a specific tag (e.g., `your-bot-addon`).
- The core provides a CLI and dashboard for installing and managing addons.