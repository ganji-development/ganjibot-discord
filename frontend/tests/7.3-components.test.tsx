import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { GuildCard } from '../src/components/GuildCard';
import { AddonCard } from '../src/components/AddonCard';
import { SettingsForm } from '../src/components/SettingsForm';

describe('Frontend Components (7.3)', () => {
    
    describe('GuildCard', () => {
        it('should render guild name', () => {
            render(<GuildCard id="123" name="Test Guild" icon={null} />);
            // Use findBy to wait for render if needed, but getBy is fine here.
            // Scoping is critical if we render multiple times in the same file without cleanup working perfectly
            // But vitest with @testing-library/react SHOULD auto-cleanup.
            // The issue might be the previous failures left DOM dirty?
            // Let's use strict queries.
            expect(screen.getByText('Test Guild')).toBeTruthy();
        });

        it('should display guild initial when no icon', () => {
            // Render with a different name to avoid collision if cleanup fails
            render(<GuildCard id="124" name="Init Guild" icon={null} />);
            expect(screen.getByText('I')).toBeTruthy();
        });

        it('should display icon image when provided', () => {
            render(<GuildCard id="125" name="Icon Guild" icon="abc123" />);
            const img = screen.getByAltText('Icon Guild');
            expect(img).toBeTruthy();
            expect(img.getAttribute('src')).toContain('cdn.discordapp.com');
        });

        it('should call onClick when clicked', () => {
            const handleClick = vi.fn();
            render(<GuildCard id="126" name="Click Guild" icon={null} onClick={handleClick} />);
            fireEvent.click(screen.getByText('Click Guild'));
            expect(handleClick).toHaveBeenCalledWith('126');
        });
    });

    describe('AddonCard', () => {
        it('should render addon name and version', () => {
            render(<AddonCard id="1" name="Addon One" version="1.0.0" />);
            expect(screen.getByText('Addon One')).toBeTruthy();
            expect(screen.getByText('v1.0.0')).toBeTruthy();
        });

        it('should render description if provided', () => {
            render(<AddonCard id="2" name="Addon Two" version="1.0" description="Desc Two" />);
            expect(screen.getByText('Desc Two')).toBeTruthy();
        });

        it('should show Install button when not installed', () => {
            const handleInstall = vi.fn();
            render(
                <AddonCard
                    id="3"
                    name="Addon Three"
                    version="1.0"
                    isInstalled={false}
                    canConfigure={true}
                    onInstall={handleInstall}
                />
            );
            
            // Scope to this card specifically if needed, but unique text is better
            const card = screen.getByText('Addon Three').closest('.addon-card');
            expect(card).toBeTruthy();
            const btn = within(card as HTMLElement).getByText('Install');
            fireEvent.click(btn);
            expect(handleInstall).toHaveBeenCalledWith('3');
        });

        it('should show toggle button when installed', () => {
            const handleToggle = vi.fn();
            render(
                <AddonCard
                    id="4"
                    name="Addon Four"
                    version="1.0"
                    isInstalled={true}
                    isEnabled={true}
                    canConfigure={true}
                    onToggle={handleToggle}
                />
            );
            const card = screen.getByText('Addon Four').closest('.addon-card');
            const btn = within(card as HTMLElement).getByText('Enabled');
            fireEvent.click(btn);
            expect(handleToggle).toHaveBeenCalledWith('4', true);
        });

        it('should show Uninstall button when canUninstall', () => {
            const handleUninstall = vi.fn();
            render(
                <AddonCard
                    id="5"
                    name="Addon Five"
                    version="1.0"
                    isInstalled={true}
                    canUninstall={true}
                    onUninstall={handleUninstall}
                />
            );
            const card = screen.getByText('Addon Five').closest('.addon-card');
            const btn = within(card as HTMLElement).getByText('Uninstall');
            fireEvent.click(btn);
            expect(handleUninstall).toHaveBeenCalledWith('5');
        });
    });

    describe('SettingsForm', () => {
        const mockFields = [
            { key: 'prefix', label: 'Command Prefix', type: 'text' as const, placeholder: '!' },
            { key: 'notifications', label: 'Enable Notifications', type: 'checkbox' as const, description: 'Receive alerts' }
        ];

        it('should render form title', () => {
            render(
                <SettingsForm
                    title="Unique Settings Title"
                    fields={mockFields}
                    initialValues={{ prefix: '!', notifications: false }}
                    onSave={() => {}}
                />
            );
            expect(screen.getByText('Unique Settings Title')).toBeTruthy();
        });

        it('should render all fields', () => {
            const { container } = render(
                <SettingsForm
                    fields={mockFields}
                    initialValues={{ prefix: '!', notifications: false }}
                    onSave={() => {}}
                />
            );
            // Use placeholder for robust finding of text inputs if label association is flaky in JSDOM
            expect(within(container).getByPlaceholderText('!')).toBeTruthy();
            expect(within(container).getByText('Receive alerts')).toBeTruthy();
        });

        it('should enable save button after changes', () => {
            const { container } = render(
                <SettingsForm
                    fields={mockFields}
                    initialValues={{ prefix: '!', notifications: false }}
                    onSave={() => {}}
                />
            );
            const saveBtn = within(container).getByText('Save Changes');
            expect(saveBtn.hasAttribute('disabled')).toBe(true);
            
            const input = within(container).getByPlaceholderText('!');
            fireEvent.change(input, { target: { value: '?' } });
            
            expect(saveBtn.hasAttribute('disabled')).toBe(false);
        });

        it('should call onSave with updated values', () => {
            const handleSave = vi.fn();
            const { container } = render(
                <SettingsForm
                    fields={mockFields}
                    initialValues={{ prefix: '!', notifications: false }}
                    onSave={handleSave}
                />
            );
            
            const input = within(container).getByPlaceholderText('!');
            fireEvent.change(input, { target: { value: '?' } });
            
            const form = container.querySelector('form')!;
            fireEvent.submit(form);
            
            expect(handleSave).toHaveBeenCalledWith({ prefix: '?', notifications: false });
        });

        it('should reset values when Reset is clicked', () => {
            const { container } = render(
                <SettingsForm
                    fields={mockFields}
                    initialValues={{ prefix: '!', notifications: false }}
                    onSave={() => {}}
                />
            );
            
            const input = within(container).getByPlaceholderText('!') as HTMLInputElement;
            fireEvent.change(input, { target: { value: '?' } });
            expect(input.value).toBe('?');
            
            fireEvent.click(within(container).getByText('Reset'));
            expect(input.value).toBe('!');
        });
    });

});
