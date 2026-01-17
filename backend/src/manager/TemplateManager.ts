import fs from 'fs';
import { dbPath, DB_ROOT } from '../config/paths';
import { ensureDir } from '../config/ensureDir';

export interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    category: string;
    shortcut: string;
    createdAt: number;
    usageCount: number;
}

export class TemplateManager {
    private static instance: TemplateManager;
    private templates: MessageTemplate[] = [];
    private templatesPath = dbPath('templates.json');

    private constructor() {
        ensureDir(DB_ROOT);
        this.loadTemplates();
    }

    public static getInstance(): TemplateManager {
        if (!TemplateManager.instance) {
            TemplateManager.instance = new TemplateManager();
        }
        return TemplateManager.instance;
    }

    private loadTemplates() {
        if (fs.existsSync(this.templatesPath)) {
            this.templates = JSON.parse(fs.readFileSync(this.templatesPath, 'utf-8'));
        } else {
            // Crear plantillas por defecto
            this.templates = [
                {
                    id: 'greeting',
                    name: 'Saludo',
                    content: '¡Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?',
                    category: 'Atención al Cliente',
                    shortcut: '/hola',
                    createdAt: Date.now(),
                    usageCount: 0
                },
                {
                    id: 'thanks',
                    name: 'Agradecimiento',
                    content: 'Muchas gracias por tu mensaje. Te responderemos a la brevedad.',
                    category: 'Atención al Cliente',
                    shortcut: '/gracias',
                    createdAt: Date.now(),
                    usageCount: 0
                },
                {
                    id: 'schedule',
                    name: 'Horario',
                    content: 'Nuestro horario de atención es:\n📅 Lunes a Viernes: 9:00 - 18:00\n📅 Sábados: 9:00 - 13:00',
                    category: 'Información',
                    shortcut: '/horario',
                    createdAt: Date.now(),
                    usageCount: 0
                },
                {
                    id: 'contact',
                    name: 'Datos de Contacto',
                    content: '📞 Teléfono: +598 99 123 456\n📧 Email: contacto@empresa.com\n🌐 Web: www.empresa.com',
                    category: 'Información',
                    shortcut: '/contacto',
                    createdAt: Date.now(),
                    usageCount: 0
                }
            ];
            this.saveTemplates();
        }
    }

    private saveTemplates() {
        fs.writeFileSync(this.templatesPath, JSON.stringify(this.templates, null, 2));
    }

    public getAllTemplates(): MessageTemplate[] {
        return this.templates;
    }

    public getTemplateById(id: string): MessageTemplate | undefined {
        return this.templates.find(t => t.id === id);
    }

    public getTemplatesByCategory(category: string): MessageTemplate[] {
        return this.templates.filter(t => t.category === category);
    }

    public createTemplate(template: Omit<MessageTemplate, 'id' | 'createdAt' | 'usageCount'>): MessageTemplate {
        const newTemplate: MessageTemplate = {
            ...template,
            id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            usageCount: 0
        };
        
        this.templates.push(newTemplate);
        this.saveTemplates();
        return newTemplate;
    }

    public updateTemplate(id: string, updates: Partial<MessageTemplate>): MessageTemplate | null {
        const index = this.templates.findIndex(t => t.id === id);
        if (index === -1) return null;

        const current = this.templates[index]!;
        const updated: MessageTemplate = {
            id: updates.id ?? current.id,
            name: updates.name ?? current.name,
            content: updates.content ?? current.content,
            category: updates.category ?? current.category,
            shortcut: updates.shortcut ?? current.shortcut,
            createdAt: updates.createdAt ?? current.createdAt,
            usageCount: updates.usageCount ?? current.usageCount
        };
        
        this.templates[index] = updated;
        this.saveTemplates();
        return updated;
    }

    public deleteTemplate(id: string): boolean {
        const index = this.templates.findIndex(t => t.id === id);
        if (index === -1) return false;

        this.templates.splice(index, 1);
        this.saveTemplates();
        return true;
    }

    public incrementUsage(id: string) {
        const template = this.templates.find(t => t.id === id);
        if (template) {
            template.usageCount++;
            this.saveTemplates();
        }
    }

    public searchTemplates(query: string): MessageTemplate[] {
        const lowerQuery = query.toLowerCase();
        return this.templates.filter(t => 
            t.name.toLowerCase().includes(lowerQuery) ||
            t.content.toLowerCase().includes(lowerQuery) ||
            t.shortcut.toLowerCase().includes(lowerQuery) ||
            t.category.toLowerCase().includes(lowerQuery)
        );
    }

    public getCategories(): string[] {
        return [...new Set(this.templates.map(t => t.category))];
    }
}
