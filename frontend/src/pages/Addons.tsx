import { useState } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import { useParams, Link } from 'react-router-dom';
import { useGuildAccess } from '../hooks/useGuildAccess';
import { Dialog } from '../components/Dialog';
import './Addons.css';

const GET_ALL_ADDONS = gql`
    query GetAllAddons {
        addons {
            id
            name
            description
            version
            icon
        }
    }
`;

const GET_GUILD_ADDONS = gql`
    query GetGuildAddons($guildId: ID!) {
        guild(id: $guildId) {
            id
            addons {
                enabled
                addon {
                    id
                    name
                    description
                    version
                    icon
                }
            }
        }
    }
`;

const INSTALL_ADDON = gql`
    mutation InstallAddon($guildId: ID!, $addonId: ID!) {
        installAddon(guildId: $guildId, addonId: $addonId) {
            addon { id }
            enabled
        }
    }
`;

const UNINSTALL_ADDON = gql`
    mutation UninstallAddon($guildId: ID!, $addonId: ID!) {
        uninstallAddon(guildId: $guildId, addonId: $addonId)
    }
`;

const ENABLE_ADDON = gql`
    mutation EnableAddon($guildId: ID!, $addonId: ID!) {
        enableAddon(guildId: $guildId, addonId: $addonId) {
            enabled
        }
    }
`;

const DISABLE_ADDON = gql`
    mutation DisableAddon($guildId: ID!, $addonId: ID!) {
        disableAddon(guildId: $guildId, addonId: $addonId) {
            enabled
        }
    }
`;

interface Addon {
    id: string;
    name: string;
    description: string;
    version: string;
    icon: string;
}

interface GuildAddon {
    enabled: boolean;
    addon: Addon;
}

interface GetAllAddonsData {
    addons: Addon[];
}

interface GetGuildAddonsData {
    guild: {
        id: string;
        addons: GuildAddon[];
    };
}

export function Addons() {
    const { id: guildId } = useParams<{ id: string }>();
    const { can, loading: accessLoading } = useGuildAccess(guildId!);

    // Dialog states
    const [uninstallDialog, setUninstallDialog] = useState<{ open: boolean; addonId: string; addonName: string }>({
        open: false,
        addonId: '',
        addonName: '',
    });
    const [marketplaceDialog, setMarketplaceDialog] = useState(false);

    const { data: allAddonsData, loading: addonsLoading } = useQuery<GetAllAddonsData>(GET_ALL_ADDONS);
    const { data: guildData, loading: guildLoading, refetch: refetchGuild } = useQuery<GetGuildAddonsData>(GET_GUILD_ADDONS, {
        variables: { guildId: guildId! },
        skip: !guildId
    });

    const [installAddon] = useMutation(INSTALL_ADDON, { onCompleted: () => refetchGuild() });
    const [uninstallAddon] = useMutation(UNINSTALL_ADDON, { onCompleted: () => refetchGuild() });
    const [enableAddon] = useMutation(ENABLE_ADDON, { onCompleted: () => refetchGuild() });
    const [disableAddon] = useMutation(DISABLE_ADDON, { onCompleted: () => refetchGuild() });

    if (accessLoading || addonsLoading || guildLoading) {
        return <div className="loading">Loading addons...</div>;
    }

    const installedAddons = guildData?.guild?.addons ?? [];
    const installedIds = new Set(installedAddons.map(ga => ga.addon.id));
    const availableAddons = allAddonsData?.addons.filter(a => !installedIds.has(a.id)) ?? [];

    const handleInstall = (addonId: string) => {
        installAddon({ variables: { guildId, addonId } });
    };

    const handleUninstallClick = (addonId: string, addonName: string) => {
        setUninstallDialog({ open: true, addonId, addonName });
    };

    const handleUninstallConfirm = () => {
        uninstallAddon({ variables: { guildId, addonId: uninstallDialog.addonId } });
        setUninstallDialog({ open: false, addonId: '', addonName: '' });
    };

    const handleToggle = (addonId: string, currentState: boolean) => {
        if (currentState) {
            disableAddon({ variables: { guildId, addonId } });
        } else {
            enableAddon({ variables: { guildId, addonId } });
        }
    };

    return (
        <div className="addons-page">
            <header className="page-header">
                <Link to={`/guild/${guildId}`} className="btn-back">← Back</Link>
                <h1>Addons</h1>
                <p>Manage addons for this server</p>
            </header>

            {/* Installed Addons Section */}
            <section className="installed-section">
                <div className="section-header">
                    <h2>Installed Addons</h2>
                    <button
                        className="btn-marketplace"
                        onClick={() => setMarketplaceDialog(true)}
                    >
                        🛒 Browse Marketplace
                    </button>
                </div>

                {installedAddons.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🧩</div>
                        <h3>No addons installed</h3>
                        <p>Click "Browse Marketplace" above to discover and install addons.</p>
                    </div>
                ) : (
                    <table className="addons-table">
                        <thead>
                            <tr>
                                <th>Addon</th>
                                <th>Version</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {installedAddons.map((ga) => (
                                <tr key={ga.addon.id}>
                                    <td>
                                        <div className="addon-info-cell">
                                            <span className="addon-icon">{ga.addon.icon || '🧩'}</span>
                                            <div className="addon-details">
                                                <h4>{ga.addon.name}</h4>
                                                <p>{ga.addon.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="version-badge">v{ga.addon.version}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${ga.enabled ? 'enabled' : 'disabled'}`}>
                                            {ga.enabled ? '✓ Enabled' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="addon-actions">
                                            {can.configure && (
                                                <button
                                                    className={`btn-toggle ${ga.enabled ? 'on' : 'off'}`}
                                                    onClick={() => handleToggle(ga.addon.id, ga.enabled)}
                                                >
                                                    {ga.enabled ? 'Disable' : 'Enable'}
                                                </button>
                                            )}
                                            {can.destroy && (
                                                <button
                                                    className="btn-danger"
                                                    onClick={() => handleUninstallClick(ga.addon.id, ga.addon.name)}
                                                >
                                                    Uninstall
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {/* Available Addons Section */}
            {availableAddons.length > 0 && (
                <section className="available-section">
                    <h2>Available Addons</h2>
                    <div className="addons-grid">
                        {availableAddons.map((addon) => (
                            <div key={addon.id} className="addon-card">
                                <div className="addon-header">
                                    <span className="addon-icon">{addon.icon || '🧩'}</span>
                                    <div className="addon-meta">
                                        <h3>{addon.name}</h3>
                                        <span className="version">v{addon.version}</span>
                                    </div>
                                </div>
                                <p className="addon-description">{addon.description}</p>
                                <div className="addon-actions">
                                    {can.configure && (
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleInstall(addon.id)}
                                        >
                                            Install
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Uninstall Confirmation Dialog */}
            <Dialog
                open={uninstallDialog.open}
                title="Uninstall Addon"
                message={`Are you sure you want to uninstall "${uninstallDialog.addonName}"? All configuration for this addon will be lost.`}
                variant="danger"
                confirmText="Uninstall"
                cancelText="Cancel"
                onConfirm={handleUninstallConfirm}
                onCancel={() => setUninstallDialog({ open: false, addonId: '', addonName: '' })}
            />

            {/* Marketplace Coming Soon Dialog */}
            <Dialog
                open={marketplaceDialog}
                title="Addon Marketplace"
                message="The Addon Marketplace is coming soon! You'll be able to discover and install community-created addons to extend your bot's functionality."
                variant="alert"
                confirmText="Got it!"
                onConfirm={() => setMarketplaceDialog(false)}
            />
        </div>
    );
}
