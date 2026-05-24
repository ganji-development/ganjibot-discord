import { useState, useMemo } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGuildAccess, AccessLevel } from '../hooks/useGuildAccess';
import { UserPicker } from '../components/UserPicker';
import { RolePicker } from '../components/RolePicker';
import { Dialog } from '../components/Dialog';
import './AccessManagement.css';

const GET_GUILD_ACCESS = gql`
    query GetGuildAccess($guildId: ID!) {
        guild(id: $guildId) {
            id
            ownerId
        }
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

const GET_GUILD_MEMBERS = gql`
    query GetGuildMembers($guildId: ID!) {
        guildMembers(guildId: $guildId) {
            id
            username
            displayName
            avatar
        }
    }
`;

const GET_GUILD_ROLES = gql`
    query GetGuildRoles($guildId: ID!) {
        guildRoles(guildId: $guildId) {
            id
            name
            color
            position
        }
    }
`;

interface AccessGrant {
    id: string;
    userId?: string;
    roleId?: string;
    level: string;
    grantedBy: string;
    createdAt: string;
}

interface GuildMember {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
}

interface GuildRole {
    id: string;
    name: string;
    color: number;
    position: number;
}

interface GetGuildAccessData {
    guild: {
        id: string;
        ownerId: string;
    };
    guildAccess: AccessGrant[];
}

interface GetGuildAccessVars {
    guildId: string;
}


const GRANT_ACCESS = gql`
    mutation GrantAccess($guildId: ID!, $userId: String, $roleId: String, $level: AccessLevel!) {
        grantAccess(guildId: $guildId, userId: $userId, roleId: $roleId, level: $level) {
            id
            level
        }
    }
`;

const REVOKE_ACCESS = gql`
    mutation RevokeAccess($guildId: ID!, $userId: String, $roleId: String) {
        revokeAccess(guildId: $guildId, userId: $userId, roleId: $roleId)
    }
`;

export function AccessManagement() {
    const { id: guildId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { loading: accessLoading, can } = useGuildAccess(guildId!);

    const [selectedUsers, setSelectedUsers] = useState<GuildMember[]>([]);
    const [selectedRole, setSelectedRole] = useState<GuildRole | null>(null);
    const [level, setLevel] = useState<AccessLevel>(AccessLevel.VIEWER);
    const [grantType, setGrantType] = useState<'user' | 'role'>('user');

    // Dialog states
    const [revokeDialog, setRevokeDialog] = useState<{ open: boolean; userId?: string; roleId?: string }>({
        open: false,
    });
    const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({
        open: false,
        message: '',
    });

    const { data, loading, error, refetch } = useQuery<GetGuildAccessData, GetGuildAccessVars>(GET_GUILD_ACCESS, {
        variables: { guildId: guildId! },
        skip: !guildId || !can.manageAccess
    });

    // Fetch members for display names
    const { data: membersData } = useQuery<{ guildMembers: GuildMember[] }>(GET_GUILD_MEMBERS, {
        variables: { guildId: guildId! },
        skip: !guildId
    });

    // Fetch roles for display names
    const { data: rolesData } = useQuery<{ guildRoles: GuildRole[] }>(GET_GUILD_ROLES, {
        variables: { guildId: guildId! },
        skip: !guildId
    });

    const [grantAccess] = useMutation(GRANT_ACCESS, { onCompleted: () => refetch() });
    const [revokeAccess] = useMutation(REVOKE_ACCESS, { onCompleted: () => refetch() });

    // Create lookup maps for user/role names
    const memberMap = useMemo(() => {
        const map = new Map<string, GuildMember>();
        membersData?.guildMembers.forEach(m => map.set(m.id, m));
        return map;
    }, [membersData]);

    const roleMap = useMemo(() => {
        const map = new Map<string, GuildRole>();
        rolesData?.guildRoles.forEach(r => map.set(r.id, r));
        return map;
    }, [rolesData]);

    // Get IDs of users that already have access
    const grantedUserIds = useMemo(() => {
        return new Set(data?.guildAccess.filter(g => g.userId).map(g => g.userId!));
    }, [data]);

    if (accessLoading) return <div className="loading">Loading permissions...</div>;

    if (!can.manageAccess) {
        return (
            <div className="access-denied">
                <h2>Access Denied</h2>
                <p>You don't have permission to manage access.</p>
                <button onClick={() => navigate(`/guild/${guildId}`)}>Back to Settings</button>
            </div>
        );
    }

    const handleGrant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (grantType === 'user') {
                for (const user of selectedUsers) {
                    await grantAccess({
                        variables: {
                            guildId,
                            userId: user.id,
                            level
                        }
                    });
                }
            } else if (selectedRole) {
                await grantAccess({
                    variables: {
                        guildId,
                        roleId: selectedRole.id,
                        level
                    }
                });
            }
            setSelectedUsers([]);
            setSelectedRole(null);
        } catch (err) {
            console.error(err);
            setErrorDialog({ open: true, message: 'Failed to grant access. Please try again.' });
        }
    };

    const handleRevokeClick = (uid?: string, rid?: string) => {
        setRevokeDialog({ open: true, userId: uid, roleId: rid });
    };

    const handleRevokeConfirm = async () => {
        try {
            await revokeAccess({
                variables: {
                    guildId,
                    userId: revokeDialog.userId,
                    roleId: revokeDialog.roleId
                }
            });
        } catch (err) {
            console.error(err);
            setErrorDialog({ open: true, message: 'Failed to revoke access. Please try again.' });
        } finally {
            setRevokeDialog({ open: false });
        }
    };

    const getGrantDisplayName = (grant: AccessGrant) => {
        if (grant.userId) {
            const member = memberMap.get(grant.userId);
            return member ? member.displayName : `User ${grant.userId.slice(-6)}`;
        }
        if (grant.roleId) {
            const role = roleMap.get(grant.roleId);
            return role ? role.name : `Role ${grant.roleId.slice(-6)}`;
        }
        return 'Unknown';
    };

    // Filter out already-granted users AND guild owner from picker
    const guildOwnerId = data?.guild?.ownerId;
    const availableUsers = membersData?.guildMembers.filter(m => 
        !grantedUserIds.has(m.id) && m.id !== guildOwnerId
    ) ?? [];

    return (
        <div className="access-management">
            <header className="page-header">
                <button className="btn-back" onClick={() => navigate(`/guild/${guildId}`)}>
                    ← Back
                </button>
                <h1>Access Management</h1>
            </header>

            <div className="grant-section">
                <h3>Grant Access</h3>
                <form onSubmit={handleGrant} className="grant-form">
                    <div className="form-group">
                        <label>Type</label>
                        <select
                            value={grantType}
                            onChange={(e) => {
                                setGrantType(e.target.value as 'user' | 'role');
                                setSelectedUsers([]);
                                setSelectedRole(null);
                            }}
                        >
                            <option value="user">User</option>
                            <option value="role">Role</option>
                        </select>
                    </div>

                    <div className="form-group form-group-user">
                        <label>{grantType === 'user' ? 'User' : 'Role'}</label>
                        {grantType === 'user' ? (
                            <UserPicker
                                guildId={guildId!}
                                selectedUsers={selectedUsers.filter(u => availableUsers.some(a => a.id === u.id))}
                                onSelectionChange={setSelectedUsers}
                                placeholder="Search for users..."
                            />
                        ) : (
                            <RolePicker
                                guildId={guildId!}
                                selectedRole={selectedRole}
                                onSelectionChange={setSelectedRole}
                                placeholder="Select a role..."
                            />
                        )}
                    </div>

                    <div className="form-group">
                        <label>Level</label>
                        <select value={level} onChange={(e) => setLevel(e.target.value as AccessLevel)}>
                            <option value={AccessLevel.ADMIN}>Admin</option>
                            <option value={AccessLevel.MODERATOR}>Moderator</option>
                            <option value={AccessLevel.VIEWER}>Viewer</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={grantType === 'user' ? selectedUsers.length === 0 : !selectedRole}
                    >
                        Grant Access
                    </button>
                </form>
            </div>

            <div className="access-list">
                <h3>Current Access Grants</h3>
                {loading && <p>Loading...</p>}
                {error && <p className="error">Error loading access grants</p>}

                {!loading && data?.guildAccess.length === 0 && (
                    <p className="empty-state">No custom access grants found.</p>
                )}

                <div className="grants-grid">
                    {data?.guildAccess.map((grant) => (
                        <div key={grant.id} className="grant-card">
                            <div className="grant-info">
                                <span className="grant-type">{grant.userId ? 'User' : 'Role'}</span>
                                <span className="grant-name">{getGrantDisplayName(grant)}</span>
                                <span className={`grant-level level-${grant.level.toLowerCase()}`}>
                                    {grant.level}
                                </span>
                            </div>
                            <button
                                className="btn-revoke"
                                onClick={() => handleRevokeClick(grant.userId, grant.roleId)}
                            >
                                Revoke
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Revoke Confirmation Dialog */}
            <Dialog
                open={revokeDialog.open}
                title="Revoke Access"
                message="Are you sure you want to revoke this access grant? This action cannot be undone."
                variant="danger"
                confirmText="Revoke"
                cancelText="Cancel"
                onConfirm={handleRevokeConfirm}
                onCancel={() => setRevokeDialog({ open: false })}
            />

            {/* Error Dialog */}
            <Dialog
                open={errorDialog.open}
                title="Error"
                message={errorDialog.message}
                variant="alert"
                confirmText="OK"
                onConfirm={() => setErrorDialog({ open: false, message: '' })}
            />
        </div>
    );
}
