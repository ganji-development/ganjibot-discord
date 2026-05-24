import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const GET_GUILDS = gql`
    query GetGuilds {
        guilds {
            id
            name
            icon
        }
    }
`;

interface Guild {
    id: string;
    name: string;
    icon: string | null;
}

export function Dashboard() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    // Check for token on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);

    const { data, loading, error } = useQuery<{ guilds: Guild[] }>(GET_GUILDS, {
        skip: !isAuthenticated, // Don't query if not authenticated
        fetchPolicy: 'network-only', // Always fetch fresh data to prevent stale guild display
    });

    const getGuildIcon = (guild: Guild) => {
        if (guild.icon) {
            return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
        }
        return null;
    };

    const handleGuildClick = (guildId: string) => {
        navigate(`/guild/${guildId}`);
    };

    const handleLogin = () => {
        window.location.href = '/api/auth/discord';
    };

    // Still checking auth status
    if (isAuthenticated === null) {
        return (
            <div className="dashboard">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated - show login prompt
    if (!isAuthenticated) {
        return (
            <div className="dashboard">
                <header className="dashboard-header">
                    <h1>Welcome to Ganjibot</h1>
                    <p>Please log in to manage your servers</p>
                </header>
                <div className="login-prompt">
                    <button className="btn btn-discord" onClick={handleLogin}>
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        Login with Discord
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Your Servers</h1>
                <p>Select a server to manage</p>
            </header>
            <div className="guild-grid">
                {loading && (
                    <div className="guild-card placeholder">
                        <div className="loading-spinner"></div>
                        <p>Loading servers...</p>
                    </div>
                )}
                {error && (
                    <div className="guild-card placeholder error">
                        <p>Error loading servers. Please try again.</p>
                    </div>
                )}
                {!loading && !error && data?.guilds.length === 0 && (
                    <div className="guild-card placeholder">
                        <p>No servers found. Make sure the bot is invited to your servers.</p>
                    </div>
                )}
                {data?.guilds.map((guild) => (
                    <div
                        key={guild.id}
                        className="guild-card"
                        onClick={() => handleGuildClick(guild.id)}
                    >
                        <div className="guild-icon">
                            {getGuildIcon(guild) ? (
                                <img src={getGuildIcon(guild)!} alt={guild.name} />
                            ) : (
                                <span className="guild-initial">{guild.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="guild-info">
                            <h3>{guild.name}</h3>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

