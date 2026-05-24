/**
 * Channel & Category API E2E Tests
 * These tests make REAL HTTP requests to the running GraphQL server
 * Requires: Backend server running on port 3066
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = 'http://localhost:3066/graphql';

// Helper to make GraphQL requests
async function graphql(query: string, variables?: Record<string, any>, token?: string) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query, variables }),
    });

    return response.json() as Promise<any>;
}

describe('Channel & Category API - E2E Tests', () => {
    // Check if server is running
    beforeAll(async () => {
        try {
            const health = await fetch('http://localhost:3066/health');
            if (!health.ok) {
                throw new Error('Backend health check failed');
            }
        } catch (error) {
            console.error('Backend server not running on port 3066');
            throw new Error('Backend server must be running for E2E tests');
        }
    });

    describe('Schema Introspection', () => {
        it('should have guildChannels query in schema', async () => {
            const result = await graphql(`
                query {
                    __schema {
                        queryType {
                            fields {
                                name
                            }
                        }
                    }
                }
            `);

            const queryFields = result.data.__schema.queryType.fields.map((f: any) => f.name);
            expect(queryFields).toContain('guildChannels');
            expect(queryFields).toContain('guildCategories');
        });

        it('should have channel mutations in schema', async () => {
            const result = await graphql(`
                query {
                    __schema {
                        mutationType {
                            fields {
                                name
                            }
                        }
                    }
                }
            `);

            const mutationFields = result.data.__schema.mutationType.fields.map((f: any) => f.name);
            expect(mutationFields).toContain('createChannel');
            expect(mutationFields).toContain('updateChannel');
            expect(mutationFields).toContain('deleteChannel');
            expect(mutationFields).toContain('moveChannel');
            expect(mutationFields).toContain('createCategory');
            expect(mutationFields).toContain('updateCategory');
            expect(mutationFields).toContain('deleteCategory');
        });

        it('should have GuildChannel type with correct fields', async () => {
            const result = await graphql(`
                query {
                    __type(name: "GuildChannel") {
                        name
                        fields {
                            name
                            type {
                                name
                                kind
                            }
                        }
                    }
                }
            `);

            expect(result.data.__type).toBeTruthy();
            const fieldNames = result.data.__type.fields.map((f: any) => f.name);
            expect(fieldNames).toContain('id');
            expect(fieldNames).toContain('name');
            expect(fieldNames).toContain('type');
            expect(fieldNames).toContain('parentId');
            expect(fieldNames).toContain('position');
        });

        it('should have GuildCategory type with channels field', async () => {
            const result = await graphql(`
                query {
                    __type(name: "GuildCategory") {
                        name
                        fields {
                            name
                            type {
                                name
                                kind
                            }
                        }
                    }
                }
            `);

            expect(result.data.__type).toBeTruthy();
            const fieldNames = result.data.__type.fields.map((f: any) => f.name);
            expect(fieldNames).toContain('id');
            expect(fieldNames).toContain('name');
            expect(fieldNames).toContain('position');
            expect(fieldNames).toContain('channels');
        });

        it('should have ChannelType enum with correct values', async () => {
            const result = await graphql(`
                query {
                    __type(name: "ChannelType") {
                        name
                        enumValues {
                            name
                        }
                    }
                }
            `);

            expect(result.data.__type).toBeTruthy();
            const enumValues = result.data.__type.enumValues.map((v: any) => v.name);
            expect(enumValues).toContain('GUILD_TEXT');
            expect(enumValues).toContain('GUILD_VOICE');
            expect(enumValues).toContain('GUILD_CATEGORY');
        });
    });

    describe('Unauthenticated Requests', () => {
        it('should return empty array for guildChannels without auth', async () => {
            const result = await graphql(`
                query {
                    guildChannels(guildId: "123456789") {
                        id
                        name
                    }
                }
            `);

            // Without auth, should return empty or null (not error)
            expect(result.data.guildChannels).toEqual([]);
        });

        it('should return empty array for guildCategories without auth', async () => {
            const result = await graphql(`
                query {
                    guildCategories(guildId: "123456789") {
                        id
                        name
                    }
                }
            `);

            expect(result.data.guildCategories).toEqual([]);
        });

        it('should return error for createChannel without auth', async () => {
            const result = await graphql(`
                mutation {
                    createChannel(guildId: "123456789", input: { name: "test", type: GUILD_TEXT }) {
                        id
                    }
                }
            `);

            expect(result.errors).toBeTruthy();
            expect(result.errors[0].message).toContain('Unauthenticated');
        });

        it('should return error for createCategory without auth', async () => {
            const result = await graphql(`
                mutation {
                    createCategory(guildId: "123456789", name: "test") {
                        id
                    }
                }
            `);

            expect(result.errors).toBeTruthy();
            expect(result.errors[0].message).toContain('Unauthenticated');
        });

        it('should return error for deleteChannel without auth', async () => {
            const result = await graphql(`
                mutation {
                    deleteChannel(channelId: "123456789")
                }
            `);

            expect(result.errors).toBeTruthy();
            expect(result.errors[0].message).toContain('Unauthenticated');
        });

        it('should return error for deleteCategory without auth', async () => {
            const result = await graphql(`
                mutation {
                    deleteCategory(categoryId: "123456789")
                }
            `);

            expect(result.errors).toBeTruthy();
            expect(result.errors[0].message).toContain('Unauthenticated');
        });
    });

    describe('Input Validation', () => {
        it('should have CreateChannelInput with required fields', async () => {
            const result = await graphql(`
                query {
                    __type(name: "CreateChannelInput") {
                        name
                        inputFields {
                            name
                            type {
                                name
                                kind
                                ofType {
                                    name
                                }
                            }
                        }
                    }
                }
            `);

            expect(result.data.__type).toBeTruthy();
            const fields = result.data.__type.inputFields;
            
            const nameField = fields.find((f: any) => f.name === 'name');
            expect(nameField).toBeTruthy();
            expect(nameField.type.kind).toBe('NON_NULL'); // required
            
            const typeField = fields.find((f: any) => f.name === 'type');
            expect(typeField).toBeTruthy();
            expect(typeField.type.kind).toBe('NON_NULL'); // required
        });

        it('should have UpdateChannelInput with optional fields', async () => {
            const result = await graphql(`
                query {
                    __type(name: "UpdateChannelInput") {
                        name
                        inputFields {
                            name
                            type {
                                kind
                            }
                        }
                    }
                }
            `);

            expect(result.data.__type).toBeTruthy();
            const fields = result.data.__type.inputFields;
            
            // All fields should be optional (not NON_NULL)
            fields.forEach((field: any) => {
                expect(field.type.kind).not.toBe('NON_NULL');
            });
        });
    });
});
