import { getNotificationSettings } from './notificationSettings.service';
import { playNotificationTone } from './notificationSound.service';
import { isChatInFocus } from './notificationFocus.service';
import { speakTts, isTtsSupported } from './tts.service';

type IncomingMessageEvent = {
    deviceId: string;
    chatId: string;
    fromMe: boolean;
    msgId?: string | null;
    timestamp?: number;
    contactName?: string | null;
};

const playedByMsg = new Map<string, number>();

type SpeakState = { lastAt: number; pending: number; timer: number | null; lastName: string };
const speakByContact = new Map<string, SpeakState>();

const normalizeName = (name: string) => String(name || '').trim();

const getFallbackName = (chatId: string, mode: 'unknown' | 'number') => {
    if (mode === 'number') return chatId.split('@')[0] || chatId;
    return 'Número desconocido';
};

const debug = (s: ReturnType<typeof getNotificationSettings>, msg: string) => {
    if (!s.debugLogs) return;
    try { console.log(msg); } catch {}
};

export const notifyIncomingMessage = (evt: IncomingMessageEvent) => {
    const s = getNotificationSettings();

    if (s.silentMode) {
        debug(s, '[notif] suprimido: silentMode');
        return;
    }

    if (evt.fromMe) return;

    const deviceId = String(evt.deviceId || '');
    const chatId = String(evt.chatId || '');
    if (!deviceId || !chatId) return;

    const msgId = String(evt.msgId || '');
    const msgKey = msgId ? `${deviceId}:${chatId}:${msgId}` : `${deviceId}:${chatId}:${String(evt.timestamp || '')}`;
    const now = Date.now();
    const lastPlayed = playedByMsg.get(msgKey) || 0;
    if (msgKey && now - lastPlayed < 1000) return;
    if (msgKey) playedByMsg.set(msgKey, now);

    const focused = isChatInFocus(chatId);
    debug(s, `[notif] nuevo mensaje: device=${deviceId} chat=${chatId} focus=${focused}`);

    if (s.toneEnabled) {
        if (!focused || s.playToneWhileChatOpen) {
            playNotificationTone({ toneId: s.toneId, volume: s.toneVolume });
            debug(s, `[notif] tono reproducido: id=${s.toneId} vol=${s.toneVolume}`);
        } else {
            debug(s, '[notif] tono suprimido: chat en foco');
        }
    }

    if (!s.ttsEnabled) return;
    if (!isTtsSupported()) return;

    const contactKey = `${deviceId}:${chatId}`;
    const state = speakByContact.get(contactKey) || { lastAt: 0, pending: 0, timer: null, lastName: '' };
    const nameRaw = normalizeName(String(evt.contactName || ''));
    const name = nameRaw || getFallbackName(chatId, s.ttsUnknownNameMode);
    state.lastName = name;
    state.pending += 1;

    const cooldownMs = 10000;
    const canSpeakNow = now - state.lastAt >= cooldownMs;

    const speak = (count: number) => {
        const text = count > 1 ? `${count} mensajes de ${name}` : (s.ttsFormat === 'name' ? name : `Mensaje de ${name}`);
        speakTts(text, {
            voiceURI: s.ttsVoiceURI || undefined,
            lang: s.ttsLang === 'auto' ? null : s.ttsLang,
            rate: s.ttsRate,
            pitch: s.ttsPitch,
            volume: 1
        });
        debug(s, `[notif] TTS: ${text}`);
        state.lastAt = Date.now();
        state.pending = 0;
        state.timer = null;
        speakByContact.set(contactKey, state);
    };

    if (canSpeakNow && state.pending === 1 && state.timer == null) {
        speak(1);
        return;
    }

    if (state.timer != null) {
        speakByContact.set(contactKey, state);
        return;
    }

    state.timer = window.setTimeout(() => {
        const st = speakByContact.get(contactKey);
        if (!st) return;
        const count = Math.max(1, st.pending);
        speak(count);
    }, 1500);
    speakByContact.set(contactKey, state);
};

