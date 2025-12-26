import { useParams, Link } from 'react-router-dom';

export function GuildSettings() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="guild-settings">
            <header className="page-header">
                <h1>Server Settings</h1>
                <p>Guild ID: {id}</p>
            </header>
            <nav className="settings-nav">
                <Link to={`/guild/${id}/logging`} className="card settings-card">
                    <h3>📝 Logging</h3>
                    <p>Configure event logging channels</p>
                </Link>
                <Link to={`/guild/${id}/addons`} className="card settings-card">
                    <h3>🧩 Addons</h3>
                    <p>Manage installed addons</p>
                </Link>
            </nav>
        </div>
    );
}
