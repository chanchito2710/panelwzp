import fs from 'fs';
import path from 'path';
import { dbPath } from '../config/paths';
import { ensureDir } from '../config/ensureDir';

export interface ExportMessage {
    timestamp: number;
    from: string;
    to: string;
    message: string;
    type: string;
    mediaUrl?: string;
}

export function exportToJSON(messages: ExportMessage[], chatId: string, deviceId: string): string {
    const exportData = {
        chatId,
        deviceId,
        exportedAt: new Date().toISOString(),
        messageCount: messages.length,
        messages
    };

    const exportDir = dbPath('exports');
    ensureDir(exportDir);

    const filename = `chat_${deviceId}_${chatId}_${Date.now()}.json`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    
    return filepath;
}

export function exportToCSV(messages: ExportMessage[], chatId: string, deviceId: string): string {
    const headers = ['Timestamp', 'Date', 'From', 'To', 'Message', 'Type', 'Media URL'];
    
    const rows = messages.map(msg => {
        const date = new Date(msg.timestamp).toLocaleString();
        return [
            msg.timestamp,
            `"${date}"`,
            `"${msg.from}"`,
            `"${msg.to}"`,
            `"${(msg.message || '').replace(/"/g, '""')}"`,
            msg.type,
            msg.mediaUrl || ''
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const exportDir = dbPath('exports');
    ensureDir(exportDir);

    const filename = `chat_${deviceId}_${chatId}_${Date.now()}.csv`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, csvContent, 'utf-8');
    
    return filepath;
}

export function exportToTXT(messages: ExportMessage[], chatId: string, deviceId: string): string {
    const header = `Chat Export\n` +
                   `Chat ID: ${chatId}\n` +
                   `Device ID: ${deviceId}\n` +
                   `Exported: ${new Date().toLocaleString()}\n` +
                   `Messages: ${messages.length}\n` +
                   `${'='.repeat(60)}\n\n`;

    const messageLines = messages.map(msg => {
        const date = new Date(msg.timestamp).toLocaleString();
        const from = msg.from;
        const message = msg.message || `[${msg.type}]`;
        return `[${date}] ${from}:\n${message}\n`;
    });

    const txtContent = header + messageLines.join('\n');

    const exportDir = path.join(process.cwd(), '../db/exports');
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    const filename = `chat_${deviceId}_${chatId}_${Date.now()}.txt`;
    const filepath = path.join(exportDir, filename);
    
    fs.writeFileSync(filepath, txtContent, 'utf-8');
    
    return filepath;
}
