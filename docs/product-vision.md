# Product Vision & Core Principles

## Product Overview

The project is a **modular, multipurpose Discord bot platform** designed for communities, creators, and game servers that want deep automation, analytics, and integrations without being locked into a single vendor.

### The Core

- **Open source and self-hostable**, focused on reliability, permissions, and extensibility.
- **Minimal by default**, with functionality delivered through addons (first-party, third-party, and community-built via SDK).
- Can run as a **standalone service** for those who prefer to manage their own infrastructure.

### The Cloud Option

- Provides **managed hosting**, automatic updates, backups, and scaling for users who do not want to operate their own infrastructure.
- Adds **premium features** like advanced analytics, cross-server features, and priority support on top of the same addon architecture.
- Designed for **simplicity and convenience** with optional enterprise features and SLAs.

---

## Core Principles

**Extensible**
- Everything possible is an addon; the core is a stable platform with strong contracts.
- Clear separation of concerns between core and addons.

**Open**
- Core is open source; addons can be open or closed source and distributed through a registry.
- Community-driven development with transparent roadmap and contribution guidelines.

**Self-Host First**
- All capabilities must work in self-host mode; cloud is an upgrade, not a requirement.
- Users retain full control over their data and infrastructure.

**API-First**
- Every significant feature is exposed through HTTP/WebSocket/IPC for automation and UI clients.
- Build complex workflows and integrations on top of the bot.

**Multi-Tenant Ready** (for cloud)
- Designed from day one to run many bot instances on shared infrastructure.
- Complete data isolation and resource allocation per tenant.

---

## Goals (v1–v2)

**v1: Foundation & Ecosystem**
- Provide a robust base that can replace multiple single-purpose bots in a typical server (tickets, logging, onboarding, light automation).
- Deliver a clear addon SDK that makes building modules faster than building standalone bots.
- Offer a simple but production-ready self-host story (Docker-based, single-node).
- Ship a basic hosted tier to validate the cloud model and recurring revenue.

**v2: Scale & Premium**
- Advanced analytics and cross-server management.
- Premium addons and integrations (Patreon, Stripe, Tebex).
- Improved multi-tenancy and scaling on cloud platform.
- Community addon marketplace and discovery tools.

---

## Technology Stack

- **Runtime**: Node.js + TypeScript
- **Discord Library**: discord.js
- **API**: Express.js + GraphQL
- **Frontend**: React + Vite
- **Database**: MariaDB
- **Deployment**: Docker + Kubernetes (cloud), Docker Compose (self-host)
- **Package Distribution**: NPM (addons)

---

## Success Metrics

- **Community Adoption**: Number of self-hosted instances and addon developers.
- **Cloud Traction**: Number of cloud-hosted servers and monthly recurring revenue (MRR).
- **Addon Ecosystem**: Number and quality of addons available (first-party and community).
- **Developer Experience**: Addon SDK adoption and satisfaction among developers.
- **Support**: Community engagement, issue resolution time, and user satisfaction.
