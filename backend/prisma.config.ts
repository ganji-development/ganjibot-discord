/// <reference types="node" />
/**
 * Prisma Configuration for Prisma 7+
 * Database URL is now configured here instead of schema.prisma
 */

import { defineConfig } from 'prisma/config';

// Use a default URL for prisma generate (actual connection uses adapter in code)
const databaseUrl = process.env.DATABASE_URL ?? 'mysql://localhost:3306/ganjibot';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: databaseUrl,
    },
});
