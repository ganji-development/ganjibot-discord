import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { useParams, Link } from 'react-router-dom';
import { useGuildAccess } from '../hooks/useGuildAccess';
import './AuditLogs.css';

const GET_AUDIT_LOGS = gql`
    query GetAuditLogs($guildId: ID!, $limit: Int, $offset: Int) {
        auditLogs(guildId: $guildId, limit: $limit, offset: $offset) {
            id
            userId
            action
            target
            details
            createdAt
        }
    }
`;

interface AuditLogDetails {
    channelId?: string;
    options?: Array<{ name: string; value: unknown; type: number }>;
    source?: string;
    error?: string;
}

interface AuditLog {
    id: string;
    userId: string;
    action: string;
    target?: string;
    details?: AuditLogDetails;
    createdAt: string;
}

interface GetAuditLogsData {
    auditLogs: AuditLog[];
}

export function AuditLogs() {
    const { id: guildId } = useParams<{ id: string }>();
    const { can, loading: accessLoading } = useGuildAccess(guildId!);

    const { data, loading, error } = useQuery<GetAuditLogsData>(GET_AUDIT_LOGS, {
        variables: { guildId: guildId!, limit: 50 },
        skip: !guildId || !can.moderate,
        pollInterval: 5000
    });

    if (accessLoading) return <div className="loading">Loading permissions...</div>;

    if (!can.moderate) {
        return (
            <div className="access-denied">
                <h2>Access Denied</h2>
                <p>You need MODERATOR access to view audit logs.</p>
                <Link to={`/guild/${guildId}`}>Back to Settings</Link>
            </div>
        );
    }

    const getActionDisplay = (action: string) => {
        const actionMap: Record<string, string> = {
            'COMMAND_EXECUTED': '🔧 Command',
            'ADDON_INSTALLED': '📦 Install',
            'ADDON_UNINSTALLED': '🗑️ Uninstall',
            'ADDON_ENABLED': '✅ Enable',
            'ADDON_DISABLED': '⛔ Disable',
            'CONFIG_CHANGED': '⚙️ Config',
            'ACCESS_GRANTED': '🔑 Grant',
            'ACCESS_REVOKED': '🚫 Revoke',
        };
        return actionMap[action] || action;
    };

    const hasError = (details: AuditLogDetails | undefined) => {
        return details?.error !== undefined;
    };

    return (
        <div className="audit-logs-page">
            <header className="page-header">
                <div>
                    <Link to={`/guild/${guildId}`} className="btn-back">← Back</Link>
                </div>
                <h1>Audit Logs</h1>
                <p>Recent activity in this server</p>
            </header>

            <div className="logs-container">
                {loading && <p>Loading logs...</p>}
                {error && <p className="error">Error loading logs: {error.message}</p>}
                
                {!loading && data?.auditLogs?.length === 0 && (
                    <p className="empty">No audit logs found.</p>
                )}

                <table className="logs-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Target</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.auditLogs?.map((log) => (
                            <tr key={log.id} className={hasError(log.details) ? 'result-error' : 'result-success'}>
                                <td>{new Date(log.createdAt).toLocaleString()}</td>
                                <td>{log.userId}</td>
                                <td>{getActionDisplay(log.action)}</td>
                                <td>{log.target || '-'}</td>
                                <td>
                                    {hasError(log.details) ? (
                                        <span className="error-tag" title={log.details?.error}>ERROR</span>
                                    ) : (
                                        <span className="success-tag">SUCCESS</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
