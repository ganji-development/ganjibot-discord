import { useParams, Link } from 'react-router-dom';
import { useGuildAccess } from '../hooks/useGuildAccess';
import './GuildSettings.css';

export function GuildSettings() {
    const { id } = useParams<{ id: string }>();
    const { can, accessLevel, loading } = useGuildAccess(id!);

    if (loading) return <div className="loading">Loading permissions...</div>;

    return (
        <div className="guild-settings">
            <header className="page-header">
                <div className="header-content">
                    <Link to="/" className="btn-back">← Back to Servers</Link>
                    <h1>Server Dashboard</h1>
                    <span className={`access-badge level-${accessLevel?.toLowerCase()}`}>
                        {accessLevel}
                    </span>
                </div>
            </header>
            <nav className="settings-nav">
                <Link to={`/guild/${id}/info`} className="card settings-card">
                    <h3>ℹ️ Server Info</h3>
                    <p>View server details and members</p>
                </Link>

                <Link to={`/guild/${id}/addons`} className="card settings-card">
                    <h3>🧩 Addons</h3>
                    <p>Manage installed addons</p>
                </Link>

                {can.manageAccess && (
                    <Link to={`/guild/${id}/access`} className="card settings-card access-card">
                        <h3>🔑 Access Control</h3>
                        <p>Manage user permissions</p>
                    </Link>
                )}

                {can.moderate && (
                    <Link to={`/guild/${id}/audit-logs`} className="card settings-card">
                        <h3>📜 Audit Logs</h3>
                        <p>View server activity</p>
                    </Link>
                )}
            </nav>
        </div>
    );
}
