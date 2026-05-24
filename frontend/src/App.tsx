import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { GuildSettings } from './pages/GuildSettings';
import { Addons } from './pages/Addons';
import { AuthCallback } from './pages/AuthCallback';
import { AccessManagement } from './pages/AccessManagement';
import { AuditLogs } from './pages/AuditLogs';
import { ServerInfo } from './pages/ServerInfo';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/guild/:id" element={<GuildSettings />} />
                <Route path="/guild/:id/info" element={<ServerInfo />} />
                <Route path="/guild/:id/access" element={<AccessManagement />} />
                <Route path="/guild/:id/addons" element={<Addons />} />
                <Route path="/guild/:id/audit-logs" element={<AuditLogs />} />
            </Route>
        </Routes>
    );
}

export default App;


