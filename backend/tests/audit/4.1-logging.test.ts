import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

describe('Audit Logging', () => {
    describe('AuditLog Model', () => {
        let schema: string;

        beforeAll(() => {
            schema = readFileSync(resolve(BACKEND_DIR, 'prisma/schema.prisma'), 'utf-8');
        });

        it('should define AuditLog model', () => {
            expect(schema).toContain('model AuditLog');
        });

        it('should have guildId for context', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?guildId\s+String/);
        });

        it('should have userId for actor tracking', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?userId\s+String/);
        });

        it('should have action field', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?action\s+String/);
        });

        it('should have target field', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?target\s+String/);
        });

        it('should have details JSON field', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?details\s+Json/);
        });

        it('should have ipAddress for web actions', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?ipAddress\s+String/);
        });

        it('should have createdAt timestamp', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?createdAt\s+DateTime/);
        });

        it('should have index on guildId and createdAt', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?@@index\(\[guildId,\s*createdAt\]\)/);
        });

        it('should have index on userId', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?@@index\(\[userId\]\)/);
        });

        it('should cascade delete with Guild', () => {
            expect(schema).toMatch(/model AuditLog[\s\S]*?onDelete:\s*Cascade/);
        });
    });

    describe('Command Middleware Integration', () => {
        let commandHandlerSource: string;

        beforeAll(() => {
            commandHandlerSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/CommandHandler.ts'), 'utf-8');
        });

        it('should import prisma client', () => {
            expect(commandHandlerSource).toContain("import { prisma }");
        });

        it('should create audit log entries on command execution', () => {
            expect(commandHandlerSource).toContain('prisma.auditLog.create');
        });

        it('should log command execution action', () => {
            expect(commandHandlerSource).toContain("action: 'COMMAND_EXECUTED'");
        });

        it('should capture guild context', () => {
            expect(commandHandlerSource).toContain('guildId: interaction.guildId');
        });

        it('should capture user context', () => {
            expect(commandHandlerSource).toContain('userId: interaction.user.id');
        });

        it('should capture command name as target', () => {
            expect(commandHandlerSource).toContain('target: interaction.commandName');
        });

        it('should capture command options in details', () => {
            expect(commandHandlerSource).toContain('options: interaction.options.data');
        });

        it('should capture command source', () => {
            expect(commandHandlerSource).toContain('source: command.source');
        });

        it('should handle logging errors gracefully', () => {
            expect(commandHandlerSource).toContain('Failed to create audit log entry');
        });
    });

    describe('Context Capture', () => {
        let commandHandlerSource: string;

        beforeAll(() => {
            commandHandlerSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/CommandHandler.ts'), 'utf-8');
        });

        it('should only log in guild context', () => {
            expect(commandHandlerSource).toContain('if (interaction.guildId)');
        });

        it('should capture channelId', () => {
            expect(commandHandlerSource).toContain('channelId: interaction.channelId');
        });
    });

    describe('Error Handling', () => {
        let commandHandlerSource: string;

        beforeAll(() => {
            commandHandlerSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/CommandHandler.ts'), 'utf-8');
        });

        it('should catch command execution errors', () => {
            expect(commandHandlerSource).toContain('catch (error)');
        });

        it('should log errors', () => {
            expect(commandHandlerSource).toContain('logger.error');
        });

        it('should reply to user on error', () => {
            expect(commandHandlerSource).toContain('There was an error executing this command');
        });

        it('should handle deferred interactions', () => {
            expect(commandHandlerSource).toContain('interaction.deferred');
        });
    });
});
