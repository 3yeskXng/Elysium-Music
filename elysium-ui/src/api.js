const BACKEND_URL = 'http://127.0.0.1:3000/api';

export async function fetchFromCore(endpoint, method = 'GET', body = null) {
    try {
        const options = { method };
        if (body) {
            options.headers = { 'Content-Type': 'application/json' };
            options.body = JSON.stringify(body);
        }
        const res = await fetch(`${BACKEND_URL}${endpoint}`, options);
        if (!res.ok) throw new Error(`Server Error: ${res.status}`);
        return await res.json();
    } catch (err) {
        console.warn("Core offline oder Endpoint nicht bereit:", err.message);
        return null;
    }
}