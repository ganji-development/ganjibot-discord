import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { GuildSettings } from './pages/GuildSettings';
import { LoggingConfig } from './pages/LoggingConfig';
import { Addons } from './pages/Addons';

function App() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/guild/:id" element={<GuildSettings />} />
                <Route path="/guild/:id/logging" element={<LoggingConfig />} />
                <Route path="/guild/:id/addons" element={<Addons />} />
            </Route>
        </Routes>
    );
}

export default App;
