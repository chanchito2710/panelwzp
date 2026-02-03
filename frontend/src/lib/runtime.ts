import { clearAuthToken, getAuthToken } from './auth';
const env = ((import.meta as any).env || {}) as Record<string, any>;

const normalizeBase = (raw: string) => String(raw || '').trim().replace(/\/+$/, '');
const isLocalHostName = (host: string) => {
    const h = String(host || '').trim().toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
};

const rewriteLocalhostToCurrentHost = (raw: string) => {
    const base = normalizeBase(raw);
    if (!base) return base;
    if (typeof window === 'undefined') return base;

    try {
        const u = new URL(base);
        const currentHost = String(window.location.hostname || '').trim();
        if (!currentHost) return base;
        if (!isLocalHostName(u.hostname)) return base;
        if (isLocalHostName(currentHost)) return base;
        u.hostname = currentHost;
        return normalizeBase(u.toString());
    } catch {
        return base;
    }
};

export const API_BASE = rewriteLocalhostToCurrentHost(String(env.VITE_API_BASE || ''));
export const SOCKET_URL = rewriteLocalhostToCurrentHost(String(env.VITE_SOCKET_URL || ''));

export const apiUrl = (p: string) => {
    if (!API_BASE) return p;
    if (!p) return API_BASE;
    return p.startsWith('/') ? `${API_BASE}${p}` : `${API_BASE}/${p}`;
};

export const assetUrl = (p: string) => {
    if (!API_BASE) return p;
    if (!p) return p;
    if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:') || p.startsWith('blob:')) return p;
    return p.startsWith('/') ? `${API_BASE}${p}` : `${API_BASE}/${p}`;
};

export const apiFetch = async (p: string, init: RequestInit = {}) => {
    const token = getAuthToken();
    const headers = new Headers(init.headers || {});
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(apiUrl(p), { ...init, headers });
    if (res.status === 401 && !String(p).includes('/api/auth/login')) {
        clearAuthToken();
        try { window.location.reload(); } catch {}
    }
    return res;
};
