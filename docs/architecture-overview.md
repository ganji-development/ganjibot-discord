# Bot Architecture Overview for Contributors

## Core Components

### 1. **Bot Runtime**
- **Responsibility**: Handles Discord gateway connections, REST API calls, command registration, and event dispatch.
- **Tech**: Uses `discord.js` for Discord interactions.
- **Features**:
  - Manages multiple shards for scaling.
  - Handles rate limiting and retry logic.
  - Provides a plugin interface for addons.

### 2. **Addon Manager**
- **Responsibility**: Discovers, loads, and manages addons.
- **Features**:
  - Loads addons from local files, NPM packages, or remote URLs.
  - Manages addon lifecycle (install, enable/disable, upgrade, migrate config).
  - Enforces permissions and security policies.

### 3. **Config & Storage**
- **Responsibility**: Central configuration and data storage.
- **Tech**: Uses MariaDB for persistent storage.
- **Features**:
  - Stores per-guild and per-addon configuration.
  - Manages secrets and credentials securely.
  - Provides APIs for addons to read/write config.

### 4. **HTTP API & Dashboard**
- **Responsibility**: REST/GraphQL API and web dashboard for server owners.
- **Tech**: Express.js for API, React/Vite for dashboard.
- **Features**:
  - REST/GraphQL endpoints for managing guild settings, addons, and analytics.
  - Web dashboard for server owners to manage bot settings, view logs/metrics, and install addons.

### 5. **Cloud Layer (Optional)**
- **Responsibility**: Multi-tenant orchestrator for hosted instances.
- **Tech**: Kubernetes/Docker for orchestration, cloud provider APIs for scaling.
- **Features**:
  - Spins up and manages bot instances and shard workers.
  - Handles billing, auth, and tenant isolation.
  - Provides auto-scaling, backups, and SLAs.

## Data Flow

1. **Discord Gateway**: Receives events from Discord and dispatches them to the appropriate handlers.
2. **Addon Manager**: Loads addons and registers their commands, event listeners, and HTTP routes.
3. **Config & Storage**: Stores and retrieves configuration and data for addons and the core.
4. **HTTP API & Dashboard**: Provides APIs and a web interface for managing the bot and addons.
5. **Cloud Layer**: Orchestrates multiple bot instances and handles scaling, backups, and tenant isolation.

## Security & Permissions

- **Addon Permissions**: Addons declare required permissions in their manifest. The core enforces these at runtime.
- **Admin Controls**: Server owners see a permissions summary before enabling an addon.
- **Secret Management**: Secure handling of API keys, tokens, and credentials.

## Deployment

- **Self-Hosted**: Docker images with tags for versions and channels (stable, beta).
- **Cloud**: Managed instances per server or per account, with auto-scaling and backups.