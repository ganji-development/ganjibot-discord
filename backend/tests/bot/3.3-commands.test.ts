import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

describe('Command System', () => {
    describe('CommandHandler', () => {
        let handlerSource: string;

        beforeAll(() => {
            handlerSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/CommandHandler.ts'), 'utf-8');
        });

        it('should have CommandHandler.ts', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/bot/CommandHandler.ts'))).toBe(true);
        });

        it('should export Command interface', () => {
            expect(handlerSource).toContain('export interface Command');
        });

        it('should export CommandHandler class', () => {
            expect(handlerSource).toContain('export class CommandHandler');
        });

        describe('Command Registration', () => {
            it('should have register method', () => {
                expect(handlerSource).toContain('public register(');
            });

            it('should have unregisterBySource method', () => {
                expect(handlerSource).toContain('public unregisterBySource(');
            });

            it('should have getCommands method', () => {
                expect(handlerSource).toContain('public getCommands(');
            });
        });

        describe('Command Deployment', () => {
            it('should have deploy method', () => {
                expect(handlerSource).toContain('public async deploy(');
            });

            it('should use Discord.js REST API', () => {
                expect(handlerSource).toContain('REST');
                expect(handlerSource).toContain('Routes');
            });

            it('should support guild-specific deployment in dev', () => {
                expect(handlerSource).toContain('devGuildId');
                expect(handlerSource).toContain('applicationGuildCommands');
            });

            it('should support global deployment in production', () => {
                expect(handlerSource).toContain('applicationCommands');
            });
        });

        describe('Interaction Handling', () => {
            it('should set up interaction handler', () => {
                expect(handlerSource).toContain('setupInteractionHandler');
            });

            it('should listen for interactionCreate event', () => {
                expect(handlerSource).toContain("'interactionCreate'");
            });

            it('should filter for chat input commands only', () => {
                expect(handlerSource).toContain('isChatInputCommand');
            });
        });

        describe('Audit Logging Integration', () => {
            it('should import prisma for logging', () => {
                expect(handlerSource).toContain('prisma');
            });

            it('should create audit log entries', () => {
                expect(handlerSource).toContain('auditLog.create');
            });

            it('should log COMMAND_EXECUTED action', () => {
                expect(handlerSource).toContain('COMMAND_EXECUTED');
            });
        });
    });

    describe('Core Commands', () => {
        const commandsDir = resolve(BACKEND_DIR, 'src/bot/commands');

        it('should have commands directory', () => {
            expect(existsSync(commandsDir)).toBe(true);
        });

        it('should have commands index', () => {
            expect(existsSync(resolve(commandsDir, 'index.ts'))).toBe(true);
        });

        describe('/ping Command', () => {
            it('should have ping command file', () => {
                expect(existsSync(resolve(commandsDir, 'ping.ts'))).toBe(true);
            });

            it('should export pingCommand', () => {
                const indexSource = readFileSync(resolve(commandsDir, 'index.ts'), 'utf-8');
                expect(indexSource).toContain('pingCommand');
            });
        });

        describe('/help Command', () => {
            it('should have help command file', () => {
                expect(existsSync(resolve(commandsDir, 'help.ts'))).toBe(true);
            });

            it('should export helpCommand', () => {
                const indexSource = readFileSync(resolve(commandsDir, 'index.ts'), 'utf-8');
                expect(indexSource).toContain('helpCommand');
            });
        });

        describe('/info Command', () => {
            it('should have info command file', () => {
                expect(existsSync(resolve(commandsDir, 'info.ts'))).toBe(true);
            });

            it('should export infoCommand', () => {
                const indexSource = readFileSync(resolve(commandsDir, 'index.ts'), 'utf-8');
                expect(indexSource).toContain('infoCommand');
            });
        });
    });
});
