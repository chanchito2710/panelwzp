import type { DeviceManager } from '../../manager/DeviceManager';
import type { SendMediaArgs, SendTextArgs } from '../types';
import type { WhatsAppProvider } from './WhatsAppProvider';

export class BaileysProvider implements WhatsAppProvider {
    type = 'BAILEYS' as const;
    private manager: DeviceManager;

    constructor(manager: DeviceManager) {
        this.manager = manager;
    }

    initDevice(deviceId: string, mode?: 'qr' | 'code') {
        return this.manager.initDevice(deviceId, mode);
    }

    requestPairingCode(deviceId: string, phoneNumber: string) {
        return this.manager.requestPairingCode(deviceId, phoneNumber);
    }

    stopDevice(deviceId: string) {
        return this.manager.stopDevice(deviceId);
    }

    disconnectAndClean(deviceId: string) {
        return this.manager.disconnectAndClean(deviceId);
    }

    sendText(args: SendTextArgs) {
        return this.manager.sendMessage(args.deviceId, args.chatId, args.text, args.quotedMessageId);
    }

    sendMedia(args: SendMediaArgs) {
        return this.manager.sendMedia(
            args.deviceId,
            args.chatId,
            args.fileBuffer,
            args.mimeType,
            args.caption,
            Boolean(args.isVoiceNote)
        );
    }

    getChats(deviceId: string) {
        return this.manager.getChats(deviceId);
    }

    getChatMessages(deviceId: string, chatId: string, limit?: number) {
        return this.manager.getChatMessages(deviceId, chatId, limit ?? 50);
    }

    searchMessages(deviceId: string, query: string, options?: { chatId?: string; limit?: number; fromMe?: boolean }) {
        return this.manager.searchMessages(deviceId, query, options);
    }

    createGroup(deviceId: string, name: string, participants: string[]) {
        return this.manager.createGroup(deviceId, name, participants);
    }

    getGroups(deviceId: string) {
        return this.manager.getGroups(deviceId);
    }

    getGroupMetadata(deviceId: string, groupId: string) {
        return this.manager.getGroupMetadata(deviceId, groupId);
    }

    updateGroupParticipants(deviceId: string, groupId: string, participants: string[], action: 'add' | 'remove' | 'promote' | 'demote') {
        if (action === 'add') return this.manager.addParticipantsToGroup(deviceId, groupId, participants);
        if (action === 'remove') return this.manager.removeParticipantsFromGroup(deviceId, groupId, participants);
        if (action === 'promote') return this.manager.promoteParticipants(deviceId, groupId, participants);
        return this.manager.demoteParticipants(deviceId, groupId, participants);
    }

    updateGroupSubject(deviceId: string, groupId: string, subject: string) {
        return this.manager.updateGroupSubject(deviceId, groupId, subject);
    }

    updateGroupDescription(deviceId: string, groupId: string, description: string | null) {
        return this.manager.updateGroupDescription(deviceId, groupId, description || '');
    }

    leaveGroup(deviceId: string, groupId: string) {
        return this.manager.leaveGroup(deviceId, groupId);
    }

    importChatProfilePhoto(deviceId: string, chatId: string) {
        return this.manager.importChatProfilePhoto(deviceId, chatId);
    }
}
