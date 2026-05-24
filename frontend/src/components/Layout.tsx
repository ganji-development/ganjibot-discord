import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import './Layout.css';

export function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        setSidebarOpen(false);
    }, [location]);

    const handleLogout = async () => {
        const token = localStorage.getItem('token');

        // Call logout API to invalidate session
        if (token) {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            } catch {
                // Ignore errors - we'll clear local storage anyway
            }
        }

        // Clear token and redirect
        localStorage.removeItem('token');
        navigate('/', { replace: true });
        window.location.reload(); // Force refresh to clear Apollo cache
    };

    return (
        <div className={`layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
            <div className="mobile-header">
                <button className="btn-menu" onClick={() => setSidebarOpen(true)} aria-label="Toggle menu">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <span className="mobile-title">Ganjibot</span>
            </div>
            <div className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`} onClick={() => setSidebarOpen(false)} />
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
                <div className="sidebar-footer">
                    <button className="btn-logout" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Logout
                    </button>
                </div>
            </nav>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}

