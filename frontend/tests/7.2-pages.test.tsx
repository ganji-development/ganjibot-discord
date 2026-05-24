import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing/react';
import { Login } from '../src/pages/Login';
import { Dashboard } from '../src/pages/Dashboard';
import { GuildSettings } from '../src/pages/GuildSettings';
import { Addons } from '../src/pages/Addons';
import { AuditLogs } from '../src/pages/AuditLogs';
import { AccessManagement } from '../src/pages/AccessManagement';
import { GET_MY_ACCESS_LEVEL } from '../src/hooks/useGuildAccess';
import { gql } from '@apollo/client';

// Define queries used in pages
const GET_GUILDS = gql`
    query GetGuilds {
        guilds {
            id
            name
            icon
        }
    }
`;

const GET_ALL_ADDONS = gql`
    query GetAllAddons {
        addons {
            id
            name
            description
            version
            icon
        }
    }
`;

const GET_GUILD_ADDONS = gql`
    query GetGuildAddons($guildId: ID!) {
        guild(id: $guildId) {
            id
            addons {
                enabled
                addon {
                    id
                }
            }
        }
    }
`;

const GET_AUDIT_LOGS = gql`
    query GetAuditLogs($guildId: ID!, $limit: Int, $offset: Int) {
        auditLogs(guildId: $guildId, limit: $limit, offset: $offset) {
            id
            userId
            userTag
            command
            result
            error
            duration
            createdAt
        }
    }
`;

const GET_GUILD_ACCESS = gql`
    query GetGuildAccess($guildId: ID!) {
        guildAccess(guildId: $guildId) {
            id
            userId
            roleId
            level
            grantedBy
            createdAt
        }
    }
`;

// Mocks
const mocks = [
    // Dashboard: Get Guilds
    {
        request: {
            query: GET_GUILDS
        },
        result: {
            data: {
                guilds: [
                    { id: '123', name: 'Test Guild', icon: 'icon-hash' },
                    { id: '456', name: 'Another Guild', icon: null }
                ]
            }
        }
    },
    // Guild Access Level (OWNER)
    {
        request: {
            query: GET_MY_ACCESS_LEVEL,
            variables: { guildId: '123' }
        },
        result: {
            data: {
                guild: {
                    id: '123',
                    myAccessLevel: 'OWNER'
                }
            }
        }
    },
    // Addons Data
    {
        request: {
            query: GET_ALL_ADDONS
        },
        result: {
            data: {
                addons: [
                    { id: 'a1', name: 'Moderation', description: 'Mod tools', version: '1.0', icon: '🛡️' }
                ]
            }
        }
    },
    {
        request: {
            query: GET_GUILD_ADDONS,
            variables: { guildId: '123' }
        },
        result: {
            data: {
                guild: {
                    id: '123',
                    addons: []
                }
            }
        }
    },
    // Audit Logs Data
    {
        request: {
            query: GET_AUDIT_LOGS,
            variables: { guildId: '123', limit: 50 }
        },
        result: {
            data: {
                auditLogs: [
                    {
                        id: 'log1',
                        userId: 'u1',
                        userTag: 'User#1234',
                        command: '/kick',
                        result: 'SUCCESS',
                        error: null,
                        duration: 15,
                        createdAt: new Date().toISOString()
                    }
                ]
            }
        }
    },
    // Access Management Data
    {
        request: {
            query: GET_GUILD_ACCESS,
            variables: { guildId: '123' }
        },
        result: {
            data: {
                guildAccess: [
                    {
                        id: 'ga1',
                        userId: 'u2',
                        roleId: null,
                        level: 'MODERATOR',
                        grantedBy: 'u1',
                        createdAt: new Date().toISOString()
                    }
                ]
            }
        }
    }
];

describe('Frontend Pages (7.2)', () => {
    
    describe('Login Page', () => {
        it('should render login button', () => {
            render(
                <MemoryRouter>
                    <Login />
                </MemoryRouter>
            );
            expect(screen.getByText('Login with Discord')).toBeTruthy();
        });
    });

    describe('Dashboard Page', () => {
        it('should render guilds list', async () => {
            // Mock localStorage for auth
            const setItemSpy = vi.spyOn(Storage.prototype, 'getItem');
            setItemSpy.mockReturnValue('fake-token');

            render(
                <MockedProvider mocks={mocks}>
                    <MemoryRouter>
                        <Dashboard />
                    </MemoryRouter>
                </MockedProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Your Servers')).toBeTruthy();
                expect(screen.getByText('Test Guild')).toBeTruthy();
                expect(screen.getByText('Another Guild')).toBeTruthy();
            });

            setItemSpy.mockRestore();
        });
    });

    describe('GuildSettings Page', () => {
        it('should render settings navigation', async () => {
            render(
                <MockedProvider mocks={mocks}>
                    <MemoryRouter initialEntries={['/guild/123']}>
                        <Routes>
                            <Route path="/guild/:id" element={<GuildSettings />} />
                        </Routes>
                    </MemoryRouter>
                </MockedProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Server Settings')).toBeTruthy();
                // Check for links
                expect(screen.getByText('🧩 Addons')).toBeTruthy();
                expect(screen.getByText('🔑 Access Control')).toBeTruthy();
                expect(screen.getByText('📜 Audit Logs')).toBeTruthy();
            });
        });
    });

    describe('Addons Page', () => {
        it('should list available addons', async () => {
            render(
                <MockedProvider mocks={mocks}>
                    <MemoryRouter initialEntries={['/guild/123/addons']}>
                        <Routes>
                            <Route path="/guild/:id/addons" element={<Addons />} />
                        </Routes>
                    </MemoryRouter>
                </MockedProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Addons')).toBeTruthy();
                expect(screen.getByText('Moderation')).toBeTruthy();
                expect(screen.getByText('Mod tools')).toBeTruthy();
            });
        });
    });

    describe('AccessManagement Page', () => {
        it('should list access grants', async () => {
            render(
                <MockedProvider mocks={mocks}>
                    <MemoryRouter initialEntries={['/guild/123/access']}>
                        <Routes>
                            <Route path="/guild/:id/access" element={<AccessManagement />} />
                        </Routes>
                    </MemoryRouter>
                </MockedProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Access Management')).toBeTruthy();
                // Use getAllByText since 'Grant Access' appears as both h3 and button text
                expect(screen.getAllByText('Grant Access').length).toBeGreaterThan(0);
            });
        });
    });

    describe('AuditLogs Page', () => {
        it('should display audit logs table', async () => {
            render(
                <MockedProvider mocks={mocks}>
                    <MemoryRouter initialEntries={['/guild/123/audit-logs']}>
                        <Routes>
                            <Route path="/guild/:id/audit-logs" element={<AuditLogs />} />
                        </Routes>
                    </MemoryRouter>
                </MockedProvider>
            );

            await waitFor(() => {
                expect(screen.getByText('Audit Logs')).toBeTruthy();
                expect(screen.getByText('/kick')).toBeTruthy();
                expect(screen.getByText('User#1234')).toBeTruthy();
                expect(screen.getByText('SUCCESS')).toBeTruthy();
            });
        });
    });

});
