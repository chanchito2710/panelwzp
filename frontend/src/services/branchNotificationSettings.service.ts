export type BranchNotificationSettings = {
    toneEnabled: boolean;
    toneId: number;
    toneVolume: number;
    playToneWhileChatOpen: boolean;

    ttsEnabled: boolean;
    ttsVoiceURI: string | null;
    ttsLang: 'auto' | string;
    ttsRate: number;
    ttsPitch: number;
    ttsReadNumberWhenUnknown: boolean;

    debugLogs: boolean;
};

const STORAGE_KEY = 'wzp.branch_notification_settings.v1';

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

const defaults = (): BranchNotificationSettings => ({
    toneEnabled: true,
    toneId: getLegacyToneId(),
    toneVolume: 0.5,
    playToneWhileChatOpen: false,

    ttsEnabled: false,
    ttsVoiceURI: null,
    ttsLang: 'auto',
    ttsRate: 1,
    ttsPitch: 1,
    ttsReadNumberWhenUnknown: false,

    debugLogs: false
});

const normalize = (raw: any): BranchNotificationSettings => {
    const base = defaults();
    const obj = raw && typeof raw === 'object' ? raw : {};
    return {
        toneEnabled: obj.toneEnabled === false ? false : true,
        toneId: clamp(Number(obj.toneId ?? base.toneId) || base.toneId, 1, 999),
        toneVolume: clamp(Number(obj.toneVolume ?? base.toneVolume) || base.toneVolume, 0, 1),
        playToneWhileChatOpen: Boolean(obj.playToneWhileChatOpen),

        ttsEnabled: Boolean(obj.ttsEnabled),
        ttsVoiceURI: obj.ttsVoiceURI == null ? null : String(obj.ttsVoiceURI),
        ttsLang: obj.ttsLang == null ? 'auto' : String(obj.ttsLang),
        ttsRate: clamp(Number(obj.ttsRate ?? base.ttsRate) || base.ttsRate, 0.6, 1.6),
        ttsPitch: clamp(Number(obj.ttsPitch ?? base.ttsPitch) || base.ttsPitch, 0, 2),
        ttsReadNumberWhenUnknown: Boolean(obj.ttsReadNumberWhenUnknown),

        debugLogs: Boolean(obj.debugLogs)
    };
};

type Store = Record<string, BranchNotificationSettings>;

let cache: Store | null = null;
const listeners = new Set<(branchId: string, settings: BranchNotificationSettings) => void>();

const loadStore = (): Store => {
    if (cache) return cache;
    const raw = parseJSON(localStorage.getItem(STORAGE_KEY));
    const store: Store = raw && typeof raw === 'object' ? (raw as Store) : {};
    cache = store;
    return store;
};

const saveStore = (store: Store) => {
    cache = store;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const getBranchNotificationSettings = (branchId: string): BranchNotificationSettings => {
    const id = String(branchId || '').trim();
    const store = loadStore();
    const current = store[id];
    const normalized = normalize(current);
    if (!current) {
        const next = { ...store, [id]: normalized };
        saveStore(next);
    }
    return normalized;
};

export const setBranchNotificationSettings = (branchId: string, patch: Partial<BranchNotificationSettings>) => {
    const id = String(branchId || '').trim();
    const store = loadStore();
    const prev = getBranchNotificationSettings(id);
    const nextSettings = normalize({ ...prev, ...patch });
    const nextStore = { ...store, [id]: nextSettings };
    saveStore(nextStore);
    for (const fn of listeners) fn(id, nextSettings);
};

export const subscribeBranchNotificationSettings = (fn: (branchId: string, settings: BranchNotificationSettings) => void) => {
    listeners.add(fn);
    return () => {
        listeners.delete(fn);
    };
};

window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    cache = null;
});
