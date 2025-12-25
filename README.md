# Ganjibot-Discord

A modular, multipurpose Discord bot platform with an addon architecture. Open source, self-hostable, with an optional cloud tier on Google Cloud Platform.

## Features

- **Modular Architecture** — Core bot with functionality delivered through addons
- **Self-Host First** — Full capabilities in self-hosted mode; cloud is an upgrade, not a requirement
- **Addon SDK** — Build custom addons with TypeScript, publish to NPM
- **Built-in Logging** — Comprehensive server logging out of the box
- **Web Dashboard** — Manage settings, addons, and view analytics
- **API-First** — REST + GraphQL APIs for automation and integrations

## Quick Start

### Prerequisites

- Node.js 24+
- MariaDB 10.6+ or MySQL 8+
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/Ganji-Development/ganjibot-discord.git
cd ganjibot-discord/backend

# Install dependencies (auto-generates Prisma client)
pnpm install

# Start the database (if using Docker)
docker-compose -f docker/docker-compose.yml up -d db

# Set up environment variables
cp .env.example .env
# Edit .env with your Discord bot token and database credentials

# Start the bot (database schema syncs automatically on startup)
pnpm dev
```

> **Note:** The bot automatically synchronizes the database schema on every startup,
> ensuring all tables and columns match the Prisma schema. No manual migrations needed!

### Frontend Setup

```bash
cd ganjibot-discord/frontend

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

### Docker (Recommended for Production)

```bash
cd backend
docker-compose -f docker/docker-compose.yml up -d
```

## Documentation

- [Architecture Overview](./docs/architecture-overview.md)
- [Product Vision](./docs/product-vision.md)
- [Addon SDK Specification](./docs/addon-sdk-spec.md)

## Project Structure

```
ganjibot-discord/
├── backend/                 # Bot backend (Node.js + TypeScript)
│   ├── src/
│   │   ├── bot/             # Discord.js client, sharding, events
│   │   ├── addons/          # Addon manager and loader
│   │   ├── logging/         # Built-in logging system
│   │   ├── config/          # Configuration service
│   │   ├── api/             # Express + GraphQL API
│   │   ├── database/        # Prisma client
│   │   └── index.ts         # Entry point
│   ├── prisma/              # Database schema and migrations
│   ├── docker/              # Docker configuration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                # Web dashboard (React + Vite)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
│
├── docs/                    # Documentation
│   ├── architecture-overview.md
│   ├── product-vision.md
│   └── addon-sdk-spec.md
│
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the Apache License 2.0 — see the [LICENSE](./LICENSE) file for details.

## Links

- [GitHub Repository](https://github.com/Ganji-Development/ganjibot-discord)
- [Discord Support Server](#) (Coming Soon)
- [Documentation](#) (Coming Soon)
