import { useParams } from 'react-router-dom';

export function Addons() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="addons-page">
            <header className="page-header">
                <h1>Addons</h1>
                <p>Manage addons for this server</p>
            </header>
            <div className="card">
                <p>Addon management for guild {id} will appear here.</p>
            </div>
        </div>
    );
}
