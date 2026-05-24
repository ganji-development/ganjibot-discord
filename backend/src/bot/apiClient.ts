/**
 * API Client for Bot -> Backend communication
 * Uses a signed JWT to impersonate the command caller safely
 */
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export async function graphqlRequest(query: string, variables: any, userId: string) {
    // Sign a temporary token for the user invoking the command
    const token = jwt.sign(
        { userId, sessionId: 'bot-command' }, 
        config.jwt.secret, 
        { expiresIn: '1m' }
    );

    const API_URL = `http://localhost:${config.api.port}/graphql`;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query, variables })
        });

        const json: any = await response.json();

        if (json.errors && json.errors.length > 0) {
            throw new Error(json.errors[0].message);
        }

        return json.data;
    } catch (error: any) {
        // Handle fetch errors (e.g. ECONNREFUSED)
        if (error.cause && error.cause.code === 'ECONNREFUSED') {
            throw new Error('Backend API is unavailable.');
        }
        throw error;
    }
}
