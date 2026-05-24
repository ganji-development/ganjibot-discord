import './AddonCard.css';

interface AddonCardProps {
    id: string;
    name: string;
    description?: string;
    version: string;
    icon?: string;
    isInstalled?: boolean;
    isEnabled?: boolean;
    canConfigure?: boolean;
    canUninstall?: boolean;
    onInstall?: (id: string) => void;
    onUninstall?: (id: string) => void;
    onToggle?: (id: string, enabled: boolean) => void;
}

export function AddonCard({
    id,
    name,
    description,
    version,
    icon,
    isInstalled = false,
    isEnabled = false,
    canConfigure = false,
    canUninstall = false,
    onInstall,
    onUninstall,
    onToggle
}: AddonCardProps) {
    return (
        <div className={`addon-card ${isInstalled ? 'installed' : ''} ${isEnabled ? 'enabled' : ''}`}>
            <div className="addon-icon">{icon || '🧩'}</div>
            <div className="addon-info">
                <h3>
                    {name}
                    <span className="version">v{version}</span>
                </h3>
                {description && <p>{description}</p>}
            </div>
            <div className="addon-actions">
                {isInstalled ? (
                    <>
                        {canConfigure && onToggle && (
                            <button
                                className={`btn-toggle ${isEnabled ? 'on' : 'off'}`}
                                onClick={() => onToggle(id, isEnabled)}
                            >
                                {isEnabled ? 'Enabled' : 'Disabled'}
                            </button>
                        )}
                        {canUninstall && onUninstall && (
                            <button
                                className="btn-danger small"
                                onClick={() => onUninstall(id)}
                            >
                                Uninstall
                            </button>
                        )}
                    </>
                ) : (
                    canConfigure && onInstall && (
                        <button
                            className="btn-primary"
                            onClick={() => onInstall(id)}
                        >
                            Install
                        </button>
                    )
                )}
            </div>
        </div>
    );
}
