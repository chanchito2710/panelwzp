const TOKEN_KEY = 'app_auth_token';

export const getAuthToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY) || '';
    } catch {
        return '';
    }
};

export const setAuthToken = (token: string) => {
    try {
        localStorage.setItem(TOKEN_KEY, token);
    } catch {}
};

export const clearAuthToken = () => {
    try {
        localStorage.removeItem(TOKEN_KEY);
    } catch {}
};

