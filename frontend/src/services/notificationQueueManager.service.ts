import { speakTtsAsync, isTtsSupported } from './tts.service';

type QueueItem = {
    text: string;
    voiceURI: string | null;
    lang: string | null;
    rate: number;
    pitch: number;
};

let chain = Promise.resolve();

export const enqueueTts = (item: QueueItem) => {
    if (!isTtsSupported()) return;
    const text = String(item.text || '').trim();
    if (!text) return;

    chain = chain.then(async () => {
        await speakTtsAsync(text, {
            voiceURI: item.voiceURI || undefined,
            lang: item.lang || undefined,
            rate: item.rate,
            pitch: item.pitch,
            volume: 1
        }).catch(() => {});
    });
};

