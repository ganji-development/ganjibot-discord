import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BACKEND_DIR = resolve(__dirname, '../..');
const PROJECT_ROOT = resolve(BACKEND_DIR, '..');

describe('Documentation', () => {
    describe('Root Documentation Files', () => {
        it('should have LICENSE file', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'LICENSE'))).toBe(true);
        });

        it('LICENSE should be Apache 2.0', () => {
            const license = readFileSync(resolve(PROJECT_ROOT, 'LICENSE'), 'utf-8');
            expect(license).toContain('Apache');
        });

        it('should have README.md', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'README.md'))).toBe(true);
        });

        it('README.md should contain setup instructions', () => {
            const readme = readFileSync(resolve(PROJECT_ROOT, 'README.md'), 'utf-8');
            // Should have installation or setup section
            expect(readme.toLowerCase()).toMatch(/install|setup|getting started/i);
        });

        it('should have CONTRIBUTING.md', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'CONTRIBUTING.md'))).toBe(true);
        });

        it('should have PRIVACY_POLICY.md', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'PRIVACY_POLICY.md'))).toBe(true);
        });

        it('should have TERMS_OF_SERVICE.md', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'TERMS_OF_SERVICE.md'))).toBe(true);
        });
    });

    describe('Docs Directory', () => {
        it('should have docs directory', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'docs'))).toBe(true);
        });

        it('should have PROJECT_STATUS.md', () => {
            expect(existsSync(resolve(PROJECT_ROOT, 'docs/PROJECT_STATUS.md'))).toBe(true);
        });
    });

    describe('.gitignore Configuration', () => {
        let gitignore: string;

        it('should have .gitignore file', () => {
            const gitignorePath = resolve(PROJECT_ROOT, '.gitignore');
            expect(existsSync(gitignorePath)).toBe(true);
            gitignore = readFileSync(gitignorePath, 'utf-8');
        });

        const requiredIgnores = ['node_modules', '.env', 'dist'];

        it.each(requiredIgnores)('should ignore %s', (pattern) => {
            expect(gitignore).toContain(pattern);
        });
    });
});
