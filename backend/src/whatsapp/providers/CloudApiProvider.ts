import type { Server as SocketServer } from 'socket.io';
import { getPrisma } from '../../db/prisma';
import { decrypt } from '../../utils/crypto';
import type { SendMediaArgs, SendTextArgs } from '../types';
import { ProviderError } from '../types';
import type { WhatsAppProvider } from './WhatsAppProvider';

type CloudDeviceConfig = {
    phoneNumberId: string;
    accessToken: string;
};

export class CloudApiProvider implements WhatsAppProvider {
    type = 'CLOUD' as const;
    private io: SocketServer | null;
    private graphVersion: string;

    constructor(opts: { io: SocketServer | null; graphVersion?: string }) {
        this.io = opts.io;
        this.graphVersion = String(opts.graphVersion || process.env.WHATSAPP_GRAPH_VERSION || 'v21.0').trim() || 'v21.0';
    }

    async initDevice(): Promise<any> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no usa QR/pairing para conectar', 400);
    }

    async requestPairingCode(): Promise<{ code: string }> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta pairing code', 400);
    }

    async stopDevice(): Promise<any> {
        return { success: true };
    }

    async disconnectAndClean(): Promise<{ success: boolean; message: string }> {
        return { success: true, message: 'Cloud API no mantiene sesión local para limpiar' };
    }

    private async getConfig(deviceId: string): Promise<CloudDeviceConfig> {
        const prisma = getPrisma();
        if (!prisma) throw new ProviderError('NOT_CONFIGURED', 'Base de datos no configurada', 500);
        const row = await prisma.device.findUnique({
            where: { id: deviceId },
            select: { cloudPhoneNumberId: true, cloudAccessTokenEnc: true }
        });
        const phoneNumberId = String(row?.cloudPhoneNumberId || '').trim();
        const tokenEnc = String(row?.cloudAccessTokenEnc || '').trim();
        if (!phoneNumberId || !tokenEnc) throw new ProviderError('NOT_CONFIGURED', 'Cloud API no configurada para el dispositivo', 400);
        const accessToken = decrypt(tokenEnc).trim();
        if (!accessToken) throw new ProviderError('NOT_CONFIGURED', 'Access token inválido', 400);
        return { phoneNumberId, accessToken };
    }

    private chatIdToTo(chatId: string): string {
        const id = String(chatId || '').trim();
        if (!id) throw new ProviderError('BAD_REQUEST', 'Chat inválido', 400);
        if (id.endsWith('@g.us')) throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta grupos en este panel', 400);
        return id.split('@')[0] || id;
    }

    private async graphFetch(path: string, accessToken: string, init: any) {
        const url = `https://graph.facebook.com/${this.graphVersion}${path}`;
        const headers: any = { ...(init.headers || {}) };
        headers.Authorization = `Bearer ${accessToken}`;
        const res = await fetch(url, { ...init, headers });
        const text = await res.text().catch(() => '');
        const json = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
        if (!res.ok) {
            const msg = String(json?.error?.message || text || `HTTP ${res.status}`);
            throw new ProviderError('UPSTREAM_ERROR', msg, 502);
        }
        return json;
    }

    private async uploadMedia(phoneNumberId: string, accessToken: string, fileBuffer: Buffer, mimeType: string) {
        const FormDataCtor = (globalThis as any).FormData;
        const BlobCtor = (globalThis as any).Blob;
        if (!FormDataCtor || !BlobCtor) throw new ProviderError('NOT_SUPPORTED', 'Runtime sin soporte de multipart/form-data', 500);
        const form = new FormDataCtor();
        form.append('messaging_product', 'whatsapp');
        form.append('type', mimeType);
        form.append('file', new BlobCtor([fileBuffer], { type: mimeType }), 'file');
        const json = await this.graphFetch(`/${encodeURIComponent(phoneNumberId)}/media`, accessToken, {
            method: 'POST',
            body: form as any
        });
        const id = String(json?.id || '').trim();
        if (!id) throw new ProviderError('UPSTREAM_ERROR', 'No se pudo subir media', 502);
        return id;
    }

    async sendText(args: SendTextArgs) {
        const prisma = getPrisma();
        const { phoneNumberId, accessToken } = await this.getConfig(args.deviceId);
        const to = this.chatIdToTo(args.chatId);

        let contextId: string | null = null;
        if (args.quotedMessageId && prisma) {
            const exists = await prisma.message.findUnique({ where: { waMessageId: String(args.quotedMessageId) }, select: { waMessageId: true } }).catch(() => null);
            if (exists?.waMessageId) contextId = String(exists.waMessageId);
        }

        const payload: any = {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: String(args.text || '') }
        };
        if (contextId) payload.context = { message_id: contextId };

        const json = await this.graphFetch(`/${encodeURIComponent(phoneNumberId)}/messages`, accessToken, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const msgId = String(json?.messages?.[0]?.id || '').trim();
        const ts = Date.now();

        if (prisma && msgId) {
            const waChatId = `${to}@s.whatsapp.net`;
            const existingChat = await prisma.chat.findUnique({ where: { deviceId_waChatId: { deviceId: args.deviceId, waChatId } }, select: { id: true, name: true, customName: true, unreadCount: true } }).catch(() => null);
            const chat = await prisma.chat.upsert({
                where: { deviceId_waChatId: { deviceId: args.deviceId, waChatId } },
                create: {
                    deviceId: args.deviceId,
                    waChatId,
                    name: null,
                    isGroup: false,
                    unreadCount: 0,
                    lastMessageAt: new Date(ts),
                    profilePhotoUrl: null
                },
                update: {
                    ...(existingChat?.customName ? {} : { name: existingChat?.name ?? null }),
                    lastMessageAt: new Date(ts)
                },
                select: { id: true }
            });
            await prisma.message.upsert({
                where: { waMessageId: msgId },
                create: {
                    deviceId: args.deviceId,
                    chatId: chat.id,
                    waMessageId: msgId,
                    contextWaMessageId: contextId,
                    fromMe: true,
                    source: 'panel',
                    type: 'text',
                    text: String(args.text || '') || null,
                    mediaPath: null,
                    timestamp: new Date(ts),
                    status: 'sent',
                    rawJson: null
                },
                update: {}
            });
        }

        if (msgId) {
            this.io?.emit('message:new', {
                deviceId: args.deviceId,
                chatId: `${to}@s.whatsapp.net`,
                msg: {
                    id: msgId,
                    text: String(args.text || '') || null,
                    fromMe: true,
                    timestamp: ts,
                    media: null,
                    location: null,
                    source: 'panel',
                    senderName: null
                }
            });
        }

        return json;
    }

    async sendMedia(args: SendMediaArgs) {
        const prisma = getPrisma();
        const { phoneNumberId, accessToken } = await this.getConfig(args.deviceId);
        const to = this.chatIdToTo(args.chatId);

        let contextId: string | null = null;
        if (args.quotedMessageId && prisma) {
            const exists = await prisma.message.findUnique({ where: { waMessageId: String(args.quotedMessageId) }, select: { waMessageId: true } }).catch(() => null);
            if (exists?.waMessageId) contextId = String(exists.waMessageId);
        }

        const mimeType = String(args.mimeType || '').trim() || 'application/octet-stream';
        const mediaId = await this.uploadMedia(phoneNumberId, accessToken, args.fileBuffer, mimeType);

        const type = mimeType.startsWith('image/')
            ? 'image'
            : (mimeType.startsWith('video/') ? 'video' : (mimeType.startsWith('audio/') ? 'audio' : 'document'));

        const payload: any = {
            messaging_product: 'whatsapp',
            to,
            type
        };
        if (contextId) payload.context = { message_id: contextId };

        if (type === 'image') payload.image = { id: mediaId, ...(args.caption ? { caption: String(args.caption) } : {}) };
        else if (type === 'video') payload.video = { id: mediaId, ...(args.caption ? { caption: String(args.caption) } : {}) };
        else if (type === 'audio') payload.audio = { id: mediaId, ...(args.isVoiceNote ? { voice: true } : {}) };
        else payload.document = { id: mediaId, ...(args.caption ? { caption: String(args.caption) } : {}), filename: 'file' };

        const json = await this.graphFetch(`/${encodeURIComponent(phoneNumberId)}/messages`, accessToken, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const msgId = String(json?.messages?.[0]?.id || '').trim();
        const ts = Date.now();

        if (prisma && msgId) {
            const waChatId = `${to}@s.whatsapp.net`;
            const existingChat = await prisma.chat.findUnique({ where: { deviceId_waChatId: { deviceId: args.deviceId, waChatId } }, select: { id: true, name: true, customName: true } }).catch(() => null);
            const chat = await prisma.chat.upsert({
                where: { deviceId_waChatId: { deviceId: args.deviceId, waChatId } },
                create: {
                    deviceId: args.deviceId,
                    waChatId,
                    name: null,
                    isGroup: false,
                    unreadCount: 0,
                    lastMessageAt: new Date(ts),
                    profilePhotoUrl: null
                },
                update: {
                    ...(existingChat?.customName ? {} : { name: existingChat?.name ?? null }),
                    lastMessageAt: new Date(ts)
                },
                select: { id: true }
            });
            await prisma.message.upsert({
                where: { waMessageId: msgId },
                create: {
                    deviceId: args.deviceId,
                    chatId: chat.id,
                    waMessageId: msgId,
                    contextWaMessageId: contextId,
                    fromMe: true,
                    source: 'panel',
                    type,
                    text: args.caption ? String(args.caption) : null,
                    mediaPath: null,
                    timestamp: new Date(ts),
                    status: 'sent',
                    rawJson: null
                },
                update: {}
            });
        }

        if (msgId) {
            this.io?.emit('message:new', {
                deviceId: args.deviceId,
                chatId: `${to}@s.whatsapp.net`,
                msg: {
                    id: msgId,
                    text: args.caption ? String(args.caption) : null,
                    fromMe: true,
                    timestamp: ts,
                    media: { mimeType },
                    location: null,
                    source: 'panel',
                    senderName: null
                }
            });
        }

        return json;
    }

    async getChats(deviceId: string) {
        const prisma = getPrisma();
        if (!prisma) throw new ProviderError('NOT_CONFIGURED', 'Base de datos no configurada', 500);
        const cutoff = dbReadCutoffDate();
        const rows = await prisma.chat.findMany({
            where: { deviceId, lastMessageAt: { gte: cutoff } },
            orderBy: { lastMessageAt: 'desc' },
            include: {
                messages: {
                    where: { timestamp: { gte: cutoff } },
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                    select: { text: true, fromMe: true, type: true, mediaPath: true, rawJson: true }
                }
            }
        });
        return rows.map((c: any) => {
            const last = c.messages?.[0] || null;
            return {
                id: c.waChatId,
                name: c.customName || c.name || '',
                originalName: c.name || null,
                customName: c.customName || null,
                lastMessageTime: c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : Date.now(),
                unreadCount: Number(c.unreadCount || 0),
                isGroup: Boolean(c.isGroup),
                profilePhotoUrl: c.profilePhotoUrl || null,
                lastMessage: last?.text ?? null,
                lastMessageType: last?.type ?? 'text',
                lastMessageFromMe: Boolean(last?.fromMe),
                lastMessageMedia: last?.mediaPath ? { mimeType: String(last.mediaPath || '') } : null
            };
        });
    }

    async getChatMessages(deviceId: string, chatId: string, limit: number = 50) {
        const prisma = getPrisma();
        if (!prisma) throw new ProviderError('NOT_CONFIGURED', 'Base de datos no configurada', 500);
        const cutoff = dbReadCutoffDate();
        const chatRow = await prisma.chat.findUnique({ where: { deviceId_waChatId: { deviceId, waChatId: String(chatId) } }, select: { id: true } });
        if (!chatRow?.id) return [];
        const take = Math.max(1, Math.min(200, Math.floor(Number(limit || 50))));
        const rows = await prisma.message.findMany({
            where: { deviceId, chatId: chatRow.id, timestamp: { gte: cutoff } },
            orderBy: { timestamp: 'asc' },
            take
        });
        return rows.map((m: any) => ({
            id: m.waMessageId,
            text: m.text,
            fromMe: Boolean(m.fromMe),
            timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now(),
            source: String(m.source || 'whatsapp'),
            media: m.mediaPath ? { url: m.mediaPath } : null,
            location: null,
            senderName: null,
            quotedMessage: m.contextWaMessageId ? { id: String(m.contextWaMessageId), text: null } : null
        }));
    }

    async searchMessages(deviceId: string, query: string, options?: { chatId?: string; limit?: number; fromMe?: boolean }) {
        const prisma = getPrisma();
        if (!prisma) throw new ProviderError('NOT_CONFIGURED', 'Base de datos no configurada', 500);
        const cutoff = dbReadCutoffDate();
        const q = String(query || '').trim();
        if (!q) return [];
        const take = Math.max(1, Math.min(200, Math.floor(Number(options?.limit || 50))));
        const fromMeFilter = typeof options?.fromMe === 'boolean' ? options.fromMe : undefined;
        let chatRow: any = null;
        if (options?.chatId) {
            chatRow = await prisma.chat.findUnique({ where: { deviceId_waChatId: { deviceId, waChatId: String(options.chatId) } }, select: { id: true, waChatId: true, name: true } }).catch(() => null);
        }
        const msgs = await prisma.message.findMany({
            where: {
                deviceId,
                ...(chatRow ? { chatId: chatRow.id } : {}),
                ...(fromMeFilter === undefined ? {} : { fromMe: fromMeFilter }),
                timestamp: { gte: cutoff },
                text: { contains: q }
            },
            orderBy: { timestamp: 'desc' },
            take,
            include: { chat: { select: { waChatId: true, name: true } } }
        });
        return msgs.map((m: any) => {
            const waChatId = m.chat?.waChatId || (chatRow?.waChatId ?? '');
            const chatName = String(m.chat?.name || chatRow?.name || '').trim() || waChatId.split('@')[0];
            const text = String(m.text || '');
            return {
                id: m.waMessageId,
                chatId: waChatId,
                chatName,
                text,
                fromMe: Boolean(m.fromMe),
                timestamp: m.timestamp ? new Date(m.timestamp).getTime() : Date.now(),
                matchHighlight: text
            };
        });
    }

    async createGroup(): Promise<any> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta grupos en este panel', 400);
    }
    async getGroups(): Promise<any[]> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta grupos en este panel', 400);
    }
    async getGroupMetadata(): Promise<any> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta grupos en este panel', 400);
    }
    async updateGroupParticipants(): Promise<any> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta grupos en este panel', 400);
    }
    async updateGroupSubject(): Promise<any> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta grupos en este panel', 400);
    }
    async updateGroupDescription(): Promise<any> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta grupos en este panel', 400);
    }
    async leaveGroup(): Promise<any> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta grupos en este panel', 400);
    }

    async importChatProfilePhoto(): Promise<any> {
        throw new ProviderError('NOT_SUPPORTED', 'Cloud API no soporta importar foto de perfil', 400);
    }
}

function dbReadCutoffDate() {
    const cutoffMs = dbReadCutoffMs();
    return new Date(cutoffMs);
}

function dbReadCutoffMs() {
    const days = 7;
    return Date.now() - days * 24 * 60 * 60 * 1000;
}
