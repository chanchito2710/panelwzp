export type WhatsAppProviderType = 'BAILEYS' | 'CLOUD';

export type SendTextArgs = {
    deviceId: string;
    chatId: string;
    text: string;
    quotedMessageId?: string;
};

export type SendMediaArgs = {
    deviceId: string;
    chatId: string;
    fileBuffer: Buffer;
    mimeType: string;
    caption?: string;
    isVoiceNote?: boolean;
    quotedMessageId?: string;
};

export type ProviderErrorCode =
    | 'NOT_SUPPORTED'
    | 'NOT_CONFIGURED'
    | 'NOT_CONNECTED'
    | 'BAD_REQUEST'
    | 'UPSTREAM_ERROR';

export class ProviderError extends Error {
    code: ProviderErrorCode;
    status: number;

    constructor(code: ProviderErrorCode, message: string, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
    }
}

