import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useParams, Link } from 'react-router-dom';
import { useGuildAccess } from '../hooks/useGuildAccess';
import './ServerInfo.css';

const GET_GUILD_INFO = gql`
    query GetGuildInfo($guildId: ID!) {
        guild(id: $guildId) {
            id
            name
            icon
            ownerId
            createdAt
        }
        guildMembers(guildId: $guildId) {
            id
            username
            displayName
            avatar
        }
    }
`;

interface GuildMember {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
}

interface GuildInfo {
    id: string;
    name: string;
    icon: string | null;
    ownerId: string;
    createdAt: string;
}

interface GetGuildInfoData {
    guild: GuildInfo;
    guildMembers: GuildMember[];
}

export function ServerInfo() {
    const { id: guildId } = useParams<{ id: string }>();
    const { can, loading: accessLoading } = useGuildAccess(guildId!);

    const { data, loading, error } = useQuery<GetGuildInfoData>(GET_GUILD_INFO, {
        variables: { guildId: guildId! },
        skip: !guildId
    });

    if (accessLoading || loading) {
        return <div className="loading">Loading server info...</div>;
    }

    if (error) {
        return (
            <div className="error-state">
                <h2>Error</h2>
                <p>Failed to load server information.</p>
                <Link to={`/guild/${guildId}`}>Back to Settings</Link>
            </div>
        );
    }

    if (!can.view) {
        return (
            <div className="access-denied">
                <h2>Access Denied</h2>
                <p>You don't have permission to view this server.</p>
                <Link to="/">Back to Dashboard</Link>
            </div>
        );
    }

    const guild = data?.guild;
    const members = data?.guildMembers ?? [];

    const getGuildIcon = () => {
        if (guild?.icon) {
            return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
        }
        return null;
    };

    const getAvatarUrl = (member: GuildMember) => {
        if (member.avatar) {
            return `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}.png?size=32`;
        }
        const defaultIndex = (BigInt(member.id) >> 22n) % 6n;
        return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
    };

    return (
        <div className="server-info-page">
            <header className="page-header">
                <Link to={`/guild/${guildId}`} className="btn-back">← Back</Link>
                <h1>Server Info</h1>
            </header>

            {/* Server Overview */}
            <section className="server-overview">
                <div className="server-icon-large">
                    {getGuildIcon() ? (
                        <img src={getGuildIcon()!} alt={guild?.name} />
                    ) : (
                        <div className="icon-placeholder">
                            {guild?.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="server-details">
                    <h2>{guild?.name}</h2>
                    <div className="server-stats">
                        <div className="stat">
                            <span className="stat-value">{members.length}</span>
                            <span className="stat-label">Members (cached)</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">
                                {guild?.createdAt ? new Date(guild.createdAt).toLocaleDateString() : '-'}
                            </span>
                            <span className="stat-label">Created</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Members List */}
            <section className="members-section">
                <h3>Members ({members.length})</h3>
                <p className="section-note">
                    Showing cached members. The bot caches members as they interact with the server.
                </p>
                <div className="members-grid">
                    {members.map((member) => (
                        <div key={member.id} className="member-card">
                            <img
                                src={getAvatarUrl(member)}
                                alt=""
                                className="member-avatar"
                            />
                            <div className="member-info">
                                <span className="member-name">{member.displayName}</span>
                                <span className="member-username">@{member.username}</span>
                            </div>
                            {member.id === guild?.ownerId && (
                                <span className="owner-badge">👑 Owner</span>
                            )}
                        </div>
                    ))}
                </div>
                {members.length === 0 && (
                    <p className="empty-state">No members cached yet. Members are cached as they interact with the bot.</p>
                )}
            </section>
        </div>
    );
}
