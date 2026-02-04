import type { SendMediaArgs, SendTextArgs, WhatsAppProviderType } from '../types';

export interface WhatsAppProvider {
    type: WhatsAppProviderType;
    initDevice(deviceId: string, mode?: 'qr' | 'code'): Promise<any>;
    requestPairingCode(deviceId: string, phoneNumber: string): Promise<{ code: string }>;
    stopDevice(deviceId: string): Promise<any>;
    disconnectAndClean(deviceId: string): Promise<{ success: boolean; message: string }>;
    sendText(args: SendTextArgs): Promise<any>;
    sendMedia(args: SendMediaArgs): Promise<any>;
    getChats(deviceId: string): Promise<any[]>;
    getChatMessages(deviceId: string, chatId: string, limit?: number): Promise<any[]>;
    searchMessages(
        deviceId: string,
        query: string,
        options?: { chatId?: string; limit?: number; fromMe?: boolean }
    ): Promise<any[]>;
    createGroup(deviceId: string, name: string, participants: string[]): Promise<any>;
    getGroups(deviceId: string): Promise<any[]>;
    getGroupMetadata(deviceId: string, groupId: string): Promise<any>;
    updateGroupParticipants(deviceId: string, groupId: string, participants: string[], action: 'add' | 'remove' | 'promote' | 'demote'): Promise<any>;
    updateGroupSubject(deviceId: string, groupId: string, subject: string): Promise<any>;
    updateGroupDescription(deviceId: string, groupId: string, description: string | null): Promise<any>;
    leaveGroup(deviceId: string, groupId: string): Promise<any>;
    importChatProfilePhoto(deviceId: string, chatId: string): Promise<any>;
}
