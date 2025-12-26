import { useParams } from 'react-router-dom';

export function LoggingConfig() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="logging-config">
            <header className="page-header">
                <h1>Logging Configuration</h1>
                <p>Configure which events to log and where</p>
            </header>
            <div className="card">
                <p>Logging configuration for guild {id} will appear here.</p>
            </div>
        </div>
    );
}
