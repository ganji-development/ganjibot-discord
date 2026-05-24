import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const token = searchParams.get('token');

        if (token) {
            // Store the token
            localStorage.setItem('token', token);
            // Redirect to dashboard
            navigate('/', { replace: true });
        } else {
            // No token, redirect to login
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate]);

    return (
        <div className="auth-callback">
            <p>Authenticating...</p>
        </div>
    );
}
