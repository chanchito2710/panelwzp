import fs from 'fs';
import { dbPath, DB_ROOT } from '../config/paths';
import { ensureDir } from '../config/ensureDir';

export interface ChatLabel {
    id: string;
    name: string;
    color: string;
    createdAt: number;
}

export interface ChatLabelAssignment {
    chatId: string;
    deviceId: string;
    labelIds: string[];
}

export class LabelManager {
    private static instance: LabelManager;
    private labels: ChatLabel[] = [];
    private assignments: ChatLabelAssignment[] = [];
    private labelsPath = dbPath('labels.json');
    private assignmentsPath = dbPath('label-assignments.json');

    private constructor() {
        ensureDir(DB_ROOT);
        this.loadData();
    }

    public static getInstance(): LabelManager {
        if (!LabelManager.instance) {
            LabelManager.instance = new LabelManager();
        }
        return LabelManager.instance;
    }

    private loadData() {
        if (fs.existsSync(this.labelsPath)) {
            this.labels = JSON.parse(fs.readFileSync(this.labelsPath, 'utf-8'));
        } else {
            // Crear etiquetas por defecto
            this.labels = [
                {
                    id: 'vip',
                    name: 'Cliente VIP',
                    color: '#FFD700',
                    createdAt: Date.now()
                },
                {
                    id: 'pending',
                    name: 'Pendiente',
                    color: '#FFA500',
                    createdAt: Date.now()
                },
                {
                    id: 'urgent',
                    name: 'Urgente',
                    color: '#FF4444',
                    createdAt: Date.now()
                },
                {
                    id: 'resolved',
                    name: 'Resuelto',
                    color: '#25D366',
                    createdAt: Date.now()
                },
                {
                    id: 'followup',
                    name: 'Seguimiento',
                    color: '#3B82F6',
                    createdAt: Date.now()
                }
            ];
            this.saveLabels();
        }

        if (fs.existsSync(this.assignmentsPath)) {
            this.assignments = JSON.parse(fs.readFileSync(this.assignmentsPath, 'utf-8'));
        }
    }

    private saveLabels() {
        fs.writeFileSync(this.labelsPath, JSON.stringify(this.labels, null, 2));
    }

    private saveAssignments() {
        fs.writeFileSync(this.assignmentsPath, JSON.stringify(this.assignments, null, 2));
    }

    // ========== LABELS ==========

    public getAllLabels(): ChatLabel[] {
        return this.labels;
    }

    public getLabelById(id: string): ChatLabel | undefined {
        return this.labels.find(l => l.id === id);
    }

    public createLabel(label: Omit<ChatLabel, 'id' | 'createdAt'>): ChatLabel {
        const newLabel: ChatLabel = {
            ...label,
            id: `lbl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now()
        };
        
        this.labels.push(newLabel);
        this.saveLabels();
        return newLabel;
    }

    public updateLabel(id: string, updates: Partial<ChatLabel>): ChatLabel | null {
        const index = this.labels.findIndex(l => l.id === id);
        if (index === -1) return null;

        const current = this.labels[index]!;
        const updated: ChatLabel = {
            id: updates.id ?? current.id,
            name: updates.name ?? current.name,
            color: updates.color ?? current.color,
            createdAt: updates.createdAt ?? current.createdAt
        };
        
        this.labels[index] = updated;
        this.saveLabels();
        return updated;
    }

    public deleteLabel(id: string): boolean {
        const index = this.labels.findIndex(l => l.id === id);
        if (index === -1) return false;

        this.labels.splice(index, 1);
        
        // Eliminar asignaciones de esta etiqueta
        this.assignments = this.assignments.map(a => ({
            ...a,
            labelIds: a.labelIds.filter(lid => lid !== id)
        }));
        
        this.saveLabels();
        this.saveAssignments();
        return true;
    }

    // ========== ASSIGNMENTS ==========

    public getChatLabels(deviceId: string, chatId: string): ChatLabel[] {
        const assignment = this.assignments.find(a => 
            a.deviceId === deviceId && a.chatId === chatId
        );
        
        if (!assignment) return [];
        
        return assignment.labelIds
            .map(id => this.getLabelById(id))
            .filter(l => l !== undefined) as ChatLabel[];
    }

    public assignLabels(deviceId: string, chatId: string, labelIds: string[]): boolean {
        const index = this.assignments.findIndex(a => 
            a.deviceId === deviceId && a.chatId === chatId
        );

        if (index === -1) {
            this.assignments.push({
                deviceId,
                chatId,
                labelIds
            });
        } else {
            this.assignments[index]!.labelIds = labelIds;
        }

        this.saveAssignments();
        return true;
    }

    public addLabelToChat(deviceId: string, chatId: string, labelId: string): boolean {
        const index = this.assignments.findIndex(a => 
            a.deviceId === deviceId && a.chatId === chatId
        );

        if (index === -1) {
            this.assignments.push({
                deviceId,
                chatId,
                labelIds: [labelId]
            });
        } else {
            const assignment = this.assignments[index]!;
            if (!assignment.labelIds.includes(labelId)) {
                assignment.labelIds.push(labelId);
            }
        }

        this.saveAssignments();
        return true;
    }

    public removeLabelFromChat(deviceId: string, chatId: string, labelId: string): boolean {
        const index = this.assignments.findIndex(a => 
            a.deviceId === deviceId && a.chatId === chatId
        );

        if (index === -1) return false;

        const assignment = this.assignments[index]!;
        assignment.labelIds = assignment.labelIds.filter(id => id !== labelId);
        this.saveAssignments();
        return true;
    }

    public getChatsByLabel(deviceId: string, labelId: string): string[] {
        return this.assignments
            .filter(a => a.deviceId === deviceId && a.labelIds.includes(labelId))
            .map(a => a.chatId);
    }

    public getAllAssignments(deviceId?: string): ChatLabelAssignment[] {
        if (deviceId) {
            return this.assignments.filter(a => a.deviceId === deviceId);
        }
        return this.assignments;
    }
}
