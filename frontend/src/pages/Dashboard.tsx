import './Dashboard.css';

export function Dashboard() {
    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>Your Servers</h1>
                <p>Select a server to manage</p>
            </header>
            <div className="guild-grid">
                <div className="guild-card placeholder">
                    <p>No servers found. Make sure the bot is invited to your servers.</p>
                </div>
            </div>
        </div>
    );
}
