# Contributing to Ganjibot-Discord

Thank you for your interest in contributing to Ganjibot-Discord! This document provides guidelines and information for contributors.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building something together.

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm (recommended) or npm
- MariaDB 10.6+ or MySQL 8+
- Git
- A Discord bot token for testing

### Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ganjibot-discord.git
   cd ganjibot-discord
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pnpm install
   ```

3. **Set up the database**
   ```bash
   # Using Docker (recommended)
   docker-compose -f docker/docker-compose.yml up -d db

   # Or use your own MariaDB instance
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot token and database credentials
   ```

5. **Start the backend development server**
   ```bash
   pnpm dev
   ```
   > The database schema syncs automatically on startup!

6. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend
   pnpm install
   pnpm dev
   ```

## Project Structure

```
ganjibot-discord/
├── backend/               # Bot backend (independent project)
│   ├── src/
│   │   ├── bot/           # Discord.js client, events, commands
│   │   ├── addons/        # Addon manager and loader
│   │   ├── logging/       # Built-in logging system
│   │   ├── config/        # Configuration handling
│   │   ├── api/           # Express + GraphQL API
│   │   └── database/      # Prisma client
│   ├── prisma/
│   ├── docker/
│   └── package.json
│
├── frontend/              # Web dashboard (independent project)
│   ├── src/
│   └── package.json
│
└── docs/                  # Documentation
```

## Development Workflow

### Branching Strategy

- `main` - Stable release branch
- `develop` - Development branch (PRs target here)
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Making Changes

1. Create a branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the code style guidelines

3. Write/update tests as needed

4. Commit with clear messages:
   ```bash
   git commit -m "feat: add new logging filter options"
   ```

5. Push and create a Pull Request

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Format with Prettier
- Write JSDoc comments for public APIs

Run linting before committing:
```bash
# In backend/ or frontend/
pnpm lint
pnpm format
```

## Testing

```bash
# In backend/
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run specific test file
pnpm test -- src/addons/AddonLoader.test.ts
```

## Building Addons

See the [Addon SDK Specification](./docs/addon-sdk-spec.md) for details on building addons.

Addons should be developed in separate repositories and published to NPM.

## Pull Request Guidelines

1. **Keep PRs focused** - One feature or fix per PR
2. **Update documentation** - If your change affects the API or user-facing features
3. **Add tests** - For new features and bug fixes
4. **Pass CI** - All tests and linting must pass
5. **Request review** - Tag maintainers for review

## Questions?

- Open a GitHub Discussion for questions
- Join our Discord server (link TBD)
- Check existing issues and PRs

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
