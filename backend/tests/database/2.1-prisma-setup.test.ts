import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

describe('Prisma Setup', () => {
    describe('Configuration Files', () => {
        it('should have prisma directory', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'prisma'))).toBe(true);
        });

        it('should have schema.prisma', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'prisma/schema.prisma'))).toBe(true);
        });

        it('should have prisma.config.ts', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'prisma.config.ts'))).toBe(true);
        });
    });

    describe('Schema Configuration', () => {
        let schema: string;

        it('should read schema.prisma', () => {
            schema = readFileSync(resolve(BACKEND_DIR, 'prisma/schema.prisma'), 'utf-8');
            expect(schema).toBeDefined();
        });

        it('should use mysql/mariadb provider', () => {
            const schema = readFileSync(resolve(BACKEND_DIR, 'prisma/schema.prisma'), 'utf-8');
            expect(schema).toMatch(/provider\s*=\s*"mysql"/);
        });

        it('should have prisma client generator', () => {
            const schema = readFileSync(resolve(BACKEND_DIR, 'prisma/schema.prisma'), 'utf-8');
            expect(schema).toContain('generator client');
        });

        it('should output to src/generated/prisma', () => {
            const schema = readFileSync(resolve(BACKEND_DIR, 'prisma/schema.prisma'), 'utf-8');
            expect(schema).toMatch(/output\s*=\s*".*generated.*prisma"/);
        });
    });

    describe('Generated Client', () => {
        it('should have generated prisma directory', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/generated/prisma'))).toBe(true);
        });

        it('should have client.ts in generated output', () => {
            // Check for either compiled or generated index
            const hasIndex =
                existsSync(resolve(BACKEND_DIR, 'src/generated/prisma/client.ts')) ||
                existsSync(resolve(BACKEND_DIR, 'generated/prisma/client/client.ts'));
            expect(hasIndex).toBe(true);
        });
    });

    describe('Database Module', () => {
        it('should have database module', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/database/index.ts'))).toBe(true);
        });
    });
});
