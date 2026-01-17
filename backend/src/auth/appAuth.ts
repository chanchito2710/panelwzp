import crypto from 'crypto';
import fs from 'fs';
import { dbPath } from '../config/paths';

type AuthTokenPayload = {
    u: string;
    exp: number;
};

type StoredCredentials = {
    v: 1;
    username: string;
    salt: string;
    hash: string;
    updatedAt: number;
};

const b64urlEncode = (input: Buffer | string) => {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf8');
    return buf
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
};

const b64urlDecode = (input: string) => {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(normalized + pad, 'base64');
};

const CREDENTIALS_FILE = dbPath('app-auth.json');

const getAuthUser = () => String(process.env.APP_USERNAME || 'admin');
const getAuthPass = () => String(process.env.APP_PASSWORD || 'admin');
const getAuthSecret = () => String(process.env.APP_AUTH_SECRET || 'dev-secret-change-me');

const safeReadStoredCredentials = (): StoredCredentials | null => {
    try {
        if (!fs.existsSync(CREDENTIALS_FILE)) return null;
        const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf8');
        const parsed = JSON.parse(raw) as Partial<StoredCredentials>;
        if (parsed?.v !== 1) return null;
        if (typeof parsed.username !== 'string' || !parsed.username) return null;
        if (typeof parsed.salt !== 'string' || !parsed.salt) return null;
        if (typeof parsed.hash !== 'string' || !parsed.hash) return null;
        return {
            v: 1,
            username: parsed.username,
            salt: parsed.salt,
            hash: parsed.hash,
            updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now()
        };
    } catch {
        return null;
    }
};

const hashPassword = (password: string, salt: string) => {
    const buf = crypto.scryptSync(password, salt, 64);
    return buf.toString('base64');
};

const verifyPassword = (password: string, salt: string, expectedHashB64: string) => {
    try {
        const computed = Buffer.from(hashPassword(password, salt), 'base64');
        const expected = Buffer.from(expectedHashB64, 'base64');
        if (computed.length !== expected.length) return false;
        return crypto.timingSafeEqual(computed, expected);
    } catch {
        return false;
    }
};

export const verifyCredentials = (username: string, password: string) => {
    if (typeof username !== 'string' || typeof password !== 'string') return false;
    const stored = safeReadStoredCredentials();
    if (stored) {
        if (username !== stored.username) return false;
        return verifyPassword(password, stored.salt, stored.hash);
    }
    return username === getAuthUser() && password === getAuthPass();
};

export const changePassword = (username: string, currentPassword: string, newPassword: string) => {
    if (!verifyCredentials(username, currentPassword)) {
        return { ok: false as const, error: 'Contraseña actual incorrecta' };
    }
    const trimmed = String(newPassword || '').trim();
    if (trimmed.length < 4) {
        return { ok: false as const, error: 'La nueva contraseña debe tener al menos 4 caracteres' };
    }

    const salt = crypto.randomBytes(16).toString('base64');
    const hash = hashPassword(trimmed, salt);
    const toSave: StoredCredentials = { v: 1, username, salt, hash, updatedAt: Date.now() };

    const tmp = `${CREDENTIALS_FILE}.${crypto.randomBytes(6).toString('hex')}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(toSave, null, 2), 'utf8');
    fs.renameSync(tmp, CREDENTIALS_FILE);
    return { ok: true as const };
};

export const signAuthToken = (username: string, ttlMs: number = 7 * 24 * 60 * 60 * 1000) => {
    const header = { alg: 'HS256', typ: 'APP' };
    const payload: AuthTokenPayload = { u: username, exp: Date.now() + ttlMs };

    const headerPart = b64urlEncode(JSON.stringify(header));
    const payloadPart = b64urlEncode(JSON.stringify(payload));
    const data = `${headerPart}.${payloadPart}`;
    const sig = crypto.createHmac('sha256', getAuthSecret()).update(data).digest();
    const sigPart = b64urlEncode(sig);
    return `${data}.${sigPart}`;
};

export const verifyAuthToken = (token: string): { username: string } | null => {
    try {
        if (typeof token !== 'string' || !token) return null;
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const headerPart = parts[0]!;
        const payloadPart = parts[1]!;
        const sigPart = parts[2]!;

        const data = `${headerPart}.${payloadPart}`;
        const expectedSig = crypto.createHmac('sha256', getAuthSecret()).update(data).digest();
        const actualSig = b64urlDecode(sigPart);
        if (actualSig.length !== expectedSig.length) return null;
        if (!crypto.timingSafeEqual(actualSig, expectedSig)) return null;

        const payloadRaw = b64urlDecode(payloadPart).toString('utf8');
        const payload = JSON.parse(payloadRaw) as AuthTokenPayload;
        if (!payload?.u || typeof payload.u !== 'string') return null;
        if (!payload?.exp || typeof payload.exp !== 'number') return null;
        if (Date.now() > payload.exp) return null;
        return { username: payload.u };
    } catch {
        return null;
    }
};
