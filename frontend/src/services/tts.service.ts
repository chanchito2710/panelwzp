export type TtsVoice = {
    voiceURI: string;
    name: string;
    lang: string;
    localService: boolean;
};

let voices: SpeechSynthesisVoice[] = [];
let initialized = false;

const readVoices = () => {
    try {
        voices = Array.isArray(window.speechSynthesis?.getVoices?.()) ? window.speechSynthesis.getVoices() : [];
    } catch {
        voices = [];
    }
};

export const isTtsSupported = () => {
    try {
        return typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
    } catch {
        return false;
    }
};

export const initTts = () => {
    if (initialized) return;
    initialized = true;
    readVoices();
    try {
        window.speechSynthesis?.addEventListener?.('voiceschanged', () => {
            readVoices();
        });
    } catch {}
};

export const getTtsVoices = (): TtsVoice[] => {
    initTts();
    return voices.map(v => ({
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        localService: Boolean(v.localService)
    }));
};

export const speakTts = (text: string, opts: { voiceURI?: string | null; lang?: string | null; rate?: number; pitch?: number; volume?: number } = {}) => {
    if (!isTtsSupported()) return;
    const value = String(text || '').trim();
    if (!value) return;
    initTts();

    const utter = new SpeechSynthesisUtterance(value);
    const rate = Number(opts.rate);
    const pitch = Number(opts.pitch);
    const volume = Number(opts.volume);

    if (Number.isFinite(rate)) utter.rate = Math.min(1.6, Math.max(0.6, rate));
    if (Number.isFinite(pitch)) utter.pitch = Math.min(2, Math.max(0, pitch));
    if (Number.isFinite(volume)) utter.volume = Math.min(1, Math.max(0, volume));

    const lang = String(opts.lang || '').trim();
    if (lang && lang !== 'auto') utter.lang = lang;

    const voiceURI = String(opts.voiceURI || '').trim();
    if (voiceURI) {
        const v = voices.find(x => x.voiceURI === voiceURI);
        if (v) utter.voice = v;
    }

    try {
        window.speechSynthesis.cancel();
    } catch {}
    try {
        window.speechSynthesis.speak(utter);
    } catch {}
};

export const speakTtsAsync = (text: string, opts: { voiceURI?: string | null; lang?: string | null; rate?: number; pitch?: number; volume?: number } = {}) => {
    if (!isTtsSupported()) return Promise.resolve();
    const value = String(text || '').trim();
    if (!value) return Promise.resolve();
    initTts();

    return new Promise<void>((resolve) => {
        const utter = new SpeechSynthesisUtterance(value);
        const rate = Number(opts.rate);
        const pitch = Number(opts.pitch);
        const volume = Number(opts.volume);

        if (Number.isFinite(rate)) utter.rate = Math.min(1.6, Math.max(0.6, rate));
        if (Number.isFinite(pitch)) utter.pitch = Math.min(2, Math.max(0, pitch));
        if (Number.isFinite(volume)) utter.volume = Math.min(1, Math.max(0, volume));

        const lang = String(opts.lang || '').trim();
        if (lang && lang !== 'auto') utter.lang = lang;

        const voiceURI = String(opts.voiceURI || '').trim();
        if (voiceURI) {
            const v = voices.find(x => x.voiceURI === voiceURI);
            if (v) utter.voice = v;
        }

        utter.onend = () => resolve();
        utter.onerror = () => resolve();

        try {
            window.speechSynthesis.cancel();
        } catch {}
        try {
            window.speechSynthesis.speak(utter);
        } catch {
            resolve();
        }
    });
};
