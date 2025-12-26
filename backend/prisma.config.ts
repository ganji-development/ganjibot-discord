/// <reference types="node" />
/**
 * Prisma Configuration for Prisma 7+
 * Database URL is built from component variables for consistency
 */

import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Build DATABASE_URL from component variables
const host = process.env.DATABASE_HOST ?? 'localhost';
const port = process.env.DATABASE_PORT ?? '3306';
const user = process.env.DATABASE_USER ?? 'ganjibot';
const password = process.env.DATABASE_PASSWORD ?? '';
const database = process.env.DATABASE_NAME ?? 'ganjibot';

const databaseUrl = `mysql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: databaseUrl,
    },
});

