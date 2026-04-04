// flyticket/frontend/src/api/apiClient.js

// The base URL of our Express backend
const BASE_URL = 'http://192.168.1.172:5000/api';

/**
 * A reusable fetch wrapper for our React components.
 * By centralizing this, we avoid writing `fetch()` and error parsing 50 times.
 */
export const apiClient = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;

    // Setup standard headers, specifically telling the backend we are sending JSON
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    try {
        const response = await fetch(url, { ...options, headers });

        // Native fetch does NOT automatically throw an error if the backend returns a 400 or 500 status.
        // We must check `response.ok` (which is true for 200-299 statuses) and throw the error ourselves.
        if (!response.ok) {
            // Try to extract the friendly error message our Express error handler sent
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error: ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error(`[API Error] ${endpoint}:`, error.message);
        throw error; // Rethrow so the React component can display the error to the user
    }
};