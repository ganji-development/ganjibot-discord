import { Outlet, Link } from 'react-router-dom';
import './Layout.css';

export function Layout() {
    return (
        <div className="layout">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <Link to="/" className="logo">
                        <span className="logo-icon">🤖</span>
                        <span className="logo-text">Ganjibot</span>
                    </Link>
                </div>
                <ul className="sidebar-nav">
                    <li>
                        <Link to="/">Dashboard</Link>
                    </li>
                </ul>
            </nav>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
