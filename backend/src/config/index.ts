/**
 * Configuration module
 * Loads and validates environment variables
 */

import { z } from 'zod';

// Configuration schema with validation
const configSchema = z.object({
    env: z.enum(['development', 'production', 'test']).default('development'),

    discord: z.object({
        token: z.string().min(1, 'DISCORD_TOKEN is required'),
        clientId: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
        clientSecret: z.string().min(1, 'DISCORD_CLIENT_SECRET is required'),
        devGuildId: z.string().optional(),
    }),

    database: z.object({
        host: z.string().default('localhost'),
        port: z.coerce.number().int().positive().default(3306),
        user: z.string().min(1, 'DATABASE_USER is required'),
        password: z.string().default(''),
        name: z.string().min(1, 'DATABASE_NAME is required'),
        connectionLimit: z.coerce.number().int().positive().default(10),
    }),

    api: z.object({
        port: z.coerce.number().int().positive().default(3000),
        baseUrl: z.url().default('http://localhost:3000'),
    }),

    jwt: z.object({
        secret: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
        expiresIn: z.string().default('7d'),
    }),

    dashboard: z.object({
        url: z.url().default('http://localhost:5173'),
    }),

    logging: z.object({
        level: z
            .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
            .default('info'),
        pretty: z.coerce.boolean().default(true),
    }),

    gcp: z
        .object({
            projectId: z.string().optional(),
            region: z.string().default('us-central1'),
            cloudSqlConnectionName: z.string().optional(),
        })
        .optional(),

    addons: z.object({
        npmRegistryUrl: z.union([z.url(), z.literal('')]).optional().transform(v => v || undefined),
        npmAuthToken: z.string().optional().transform(v => v || undefined),
        localAddonsDir: z.string().default('./addons'),
    }),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
    const rawConfig = {
        env: process.env.NODE_ENV,

        discord: {
            token: process.env.DISCORD_TOKEN,
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            devGuildId: process.env.DISCORD_DEV_GUILD_ID,
        },

        database: {
            host: process.env.DATABASE_HOST,
            port: process.env.DATABASE_PORT,
            user: process.env.DATABASE_USER,
            password: process.env.DATABASE_PASSWORD,
            name: process.env.DATABASE_NAME,
            connectionLimit: process.env.DATABASE_CONNECTION_LIMIT,
        },

        api: {
            port: process.env.API_PORT,
            baseUrl: process.env.API_BASE_URL,
        },

        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN,
        },

        dashboard: {
            url: process.env.DASHBOARD_URL,
        },

        logging: {
            level: process.env.LOG_LEVEL,
            pretty: process.env.LOG_PRETTY,
        },

        gcp: {
            projectId: process.env.GCP_PROJECT_ID,
            region: process.env.GCP_REGION,
            cloudSqlConnectionName: process.env.CLOUD_SQL_CONNECTION_NAME,
        },

        addons: {
            npmRegistryUrl: process.env.NPM_REGISTRY_URL,
            npmAuthToken: process.env.NPM_AUTH_TOKEN,
            localAddonsDir: process.env.LOCAL_ADDONS_DIR,
        },
    };

    const result = configSchema.safeParse(rawConfig);

    if (!result.success) {
        console.error('Configuration validation failed:');
        for (const issue of result.error.issues) {
            console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
        }
        process.exit(1);
    }

    return result.data;
}

export const config = loadConfig();
