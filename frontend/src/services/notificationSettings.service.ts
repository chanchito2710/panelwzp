export type NotificationTtsFormat = 'name' | 'messageOf';
export type NotificationUnknownNameMode = 'unknown' | 'number';
export type NotificationTtsLangMode = 'auto' | string;

export type NotificationSettings = {
    silentMode: boolean;
    debugLogs: boolean;

    toneEnabled: boolean;
    toneId: number;
    toneVolume: number;
    playToneWhileChatOpen: boolean;

    ttsEnabled: boolean;
    ttsVoiceURI: string | null;
    ttsLang: NotificationTtsLangMode;
    ttsRate: number;
    ttsPitch: number;
    ttsFormat: NotificationTtsFormat;
    ttsUnknownNameMode: NotificationUnknownNameMode;
};

const STORAGE_KEY = 'wzp.notificationSettings.v1';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const parseJSON = (raw: string | null) => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
};

const getLegacyToneId = () => {
    const saved = localStorage.getItem('notificationTone');
    const parsed = saved ? parseInt(saved, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : 1;
};

const defaults = (): NotificationSettings => ({
    silentMode: false,
    debugLogs: false,

    toneEnabled: true,
    toneId: getLegacyToneId(),
    toneVolume: 0.5,
    playToneWhileChatOpen: false,

    ttsEnabled: false,
    ttsVoiceURI: null,
    ttsLang: 'auto',
    ttsRate: 1,
    ttsPitch: 1,
    ttsFormat: 'messageOf',
    ttsUnknownNameMode: 'unknown'
});

const normalize = (raw: any): NotificationSettings => {
    const base = defaults();
    const obj = raw && typeof raw === 'object' ? raw : {};

    return {
        silentMode: Boolean(obj.silentMode),
        debugLogs: Boolean(obj.debugLogs),

        toneEnabled: obj.toneEnabled === false ? false : true,
        toneId: clamp(Number(obj.toneId ?? base.toneId) || base.toneId, 1, 999),
        toneVolume: clamp(Number(obj.toneVolume ?? base.toneVolume) || base.toneVolume, 0, 1),
        playToneWhileChatOpen: Boolean(obj.playToneWhileChatOpen),

        ttsEnabled: Boolean(obj.ttsEnabled),
        ttsVoiceURI: obj.ttsVoiceURI == null ? null : String(obj.ttsVoiceURI),
        ttsLang: obj.ttsLang == null ? 'auto' : (String(obj.ttsLang) as NotificationTtsLangMode),
        ttsRate: clamp(Number(obj.ttsRate ?? base.ttsRate) || base.ttsRate, 0.6, 1.6),
        ttsPitch: clamp(Number(obj.ttsPitch ?? base.ttsPitch) || base.ttsPitch, 0, 2),
        ttsFormat: obj.ttsFormat === 'name' ? 'name' : 'messageOf',
        ttsUnknownNameMode: obj.ttsUnknownNameMode === 'number' ? 'number' : 'unknown'
    };
};

let cached: NotificationSettings | null = null;
const listeners = new Set<(s: NotificationSettings) => void>();

export const getNotificationSettings = (): NotificationSettings => {
    if (cached) return cached;
    const raw = parseJSON(localStorage.getItem(STORAGE_KEY));
    cached = normalize(raw);
    return cached;
};

export const setNotificationSettings = (patch: Partial<NotificationSettings>) => {
    const next = normalize({ ...getNotificationSettings(), ...patch });
    cached = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    for (const fn of listeners) fn(next);
};

export const subscribeNotificationSettings = (fn: (s: NotificationSettings) => void) => {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
};

export const isTtsIntroSeen = () => localStorage.getItem('wzp.ttsIntroSeen') === '1';
export const markTtsIntroSeen = () => localStorage.setItem('wzp.ttsIntroSeen', '1');

window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    cached = null;
    const s = getNotificationSettings();
    for (const fn of listeners) fn(s);
});
