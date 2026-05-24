import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MockedProvider } from '@apollo/client/testing/react';
import App from '../src/App';
import React from 'react';

describe('Frontend Foundation', () => {
    it('should be running React 19', () => {
        expect(React.version).toMatch(/^19/);
    });

    it('should have environment variables configured', () => {
        expect(import.meta.env.VITE_API_URL).toBeDefined();
    });

    it('should render App component without crashing', () => {
        const { getByText } = render(
            <MockedProvider>
                <MemoryRouter initialEntries={['/login']}>
                    <App />
                </MemoryRouter>
            </MockedProvider>
        );
        expect(getByText('Login with Discord')).toBeTruthy();
    });

    it('should have React Router configured', () => {
        const { container } = render(
            <MockedProvider>
                <MemoryRouter>
                    <App />
                </MemoryRouter>
            </MockedProvider>
        );
        expect(container).toBeTruthy();
    });

    // Note: Apollo Client is instantiated in main.tsx or a separate file. 
    // Testing main.tsx is difficult in unit tests. We can test the client instance if exported.
});
