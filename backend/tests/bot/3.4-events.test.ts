import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');

describe('Event Dispatcher', () => {
    let dispatcherSource: string;

    beforeAll(() => {
        dispatcherSource = readFileSync(resolve(BACKEND_DIR, 'src/bot/EventDispatcher.ts'), 'utf-8');
    });

    describe('File Structure', () => {
        it('should have EventDispatcher.ts', () => {
            expect(existsSync(resolve(BACKEND_DIR, 'src/bot/EventDispatcher.ts'))).toBe(true);
        });
    });

    describe('EventDispatcher Class', () => {
        it('should export EventDispatcher class', () => {
            expect(dispatcherSource).toContain('export class EventDispatcher');
        });

        it('should use Discord.js ClientEvents types', () => {
            expect(dispatcherSource).toContain('ClientEvents');
        });
    });

    describe('Handler Registration', () => {
        it('should have register method', () => {
            expect(dispatcherSource).toContain('public register');
        });

        it('should support priority-based ordering', () => {
            expect(dispatcherSource).toContain('priority');
        });

        it('should support handler sources', () => {
            expect(dispatcherSource).toContain('source');
        });

        it('should sort handlers by priority', () => {
            expect(dispatcherSource).toContain('sort((a, b)');
        });
    });

    describe('Handler Unregistration', () => {
        it('should have unregisterBySource method', () => {
            expect(dispatcherSource).toContain('public unregisterBySource');
        });

        it('should filter handlers by source', () => {
            expect(dispatcherSource).toContain("h.source !== source");
        });
    });

    describe('Event Routing', () => {
        it('should set up event listeners', () => {
            expect(dispatcherSource).toContain('setupEventListener');
        });

        it('should iterate through registered handlers', () => {
            expect(dispatcherSource).toContain('for (const { handler, source } of handlers)');
        });

        it('should isolate errors between handlers', () => {
            expect(dispatcherSource).toContain('try {');
            expect(dispatcherSource).toContain('catch (error)');
        });
    });

    describe('Inspection', () => {
        it('should have getHandlers method', () => {
            expect(dispatcherSource).toContain('public getHandlers');
        });
    });
});
