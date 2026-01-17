import React, { useState, useEffect } from 'react';
import { Button, Input, Modal, Form, Select, Card, Space, Tag, Typography, Popconfirm, Tooltip } from 'antd';
import { Plus, Edit, Trash2, Copy, TrendingUp } from 'lucide-react';
import { apiFetch } from '../lib/runtime';

const { TextArea } = Input;
const { Text } = Typography;

interface MessageTemplate {
    id: string;
    name: string;
    content: string;
    category: string;
    shortcut: string;
    createdAt: number;
    usageCount: number;
}

interface TemplatesPanelProps {
    onSelectTemplate: (content: string, templateId: string) => void;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ onSelectTemplate }) => {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [form] = Form.useForm();

    useEffect(() => {
        fetchTemplates();
        fetchCategories();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/api/templates');
            const data = await res.json();
            setTemplates(data);
        } catch (err) {
            console.error('Error al cargar plantillas:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await apiFetch('/api/templates/categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error('Error al cargar categorías:', err);
        }
    };

    const handleSaveTemplate = async (values: any) => {
        try {
            const method = editingTemplate ? 'PUT' : 'POST';
            
            await apiFetch(editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values)
            });

            await fetchTemplates();
            await fetchCategories();
            setIsModalOpen(false);
            setEditingTemplate(null);
            form.resetFields();
        } catch (err) {
            console.error('Error al guardar plantilla:', err);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        try {
            await apiFetch(`/api/templates/${id}`, {
                method: 'DELETE'
            });
            await fetchTemplates();
            await fetchCategories();
        } catch (err) {
            console.error('Error al eliminar plantilla:', err);
        }
    };

    const handleUseTemplate = async (template: MessageTemplate) => {
        try {
            await apiFetch(`/api/templates/${template.id}/use`, {
                method: 'POST'
            });
            
            // Copiar al portapapeles
            await navigator.clipboard.writeText(template.content);
            
            // Notificar al componente padre
            onSelectTemplate(template.content, template.id);
            
            // Mostrar mensaje de éxito
            const { message } = await import('antd');
            message.success({
                content: '📋 Plantilla copiada al portapapeles. Pega con Ctrl+V en el chat.',
                duration: 3
            });
            
            await fetchTemplates();
        } catch (err) {
            console.error('Error al usar plantilla:', err);
        }
    };

    const openEditModal = (template: MessageTemplate) => {
        setEditingTemplate(template);
        form.setFieldsValue(template);
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setEditingTemplate(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = !searchTerm || 
            template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.shortcut.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div style={{ padding: 20, background: '#0b141a', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <Typography.Title level={4} style={{ color: '#e9edef', margin: 0 }}>
                    Plantillas de Respuestas
                </Typography.Title>
                <Button 
                    type="primary" 
                    icon={<Plus size={16} />} 
                    onClick={openCreateModal}
                >
                    Nueva Plantilla
                </Button>
            </div>

            {/* Barra de búsqueda y filtros */}
            <Space direction="vertical" style={{ width: '100%', marginBottom: 20 }}>
                <Space style={{ width: '100%' }}>
                    <Input
                        placeholder="Buscar plantillas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            width: 300,
                            background: '#202c33',
                            borderColor: '#3b4a54',
                            color: '#e9edef'
                        }}
                        allowClear
                    />
                    <Select
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        style={{ width: 200 }}
                        options={[
                            { value: 'all', label: '📁 Todas las categorías' },
                            ...categories.map(cat => ({ value: cat, label: cat }))
                        ]}
                    />
                    <Tag color="blue">{filteredTemplates.length} plantilla(s)</Tag>
                </Space>
            </Space>

            {/* Grid de plantillas */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16
            }}>
                {filteredTemplates.map(template => (
                    <Card
                        key={template.id}
                        size="small"
                        style={{ 
                            background: '#111b21',
                            borderColor: '#3b4a54'
                        }}
                        actions={[
                            <Tooltip title="Usar plantilla" key="use">
                                <Button 
                                    type="text" 
                                    icon={<Copy size={16} color="#25D366" />}
                                    onClick={() => handleUseTemplate(template)}
                                />
                            </Tooltip>,
                            <Tooltip title="Editar" key="edit">
                                <Button 
                                    type="text" 
                                    icon={<Edit size={16} color="#8696a0" />}
                                    onClick={() => openEditModal(template)}
                                />
                            </Tooltip>,
                            <Popconfirm
                                title="¿Eliminar esta plantilla?"
                                onConfirm={() => handleDeleteTemplate(template.id)}
                                okText="Sí"
                                cancelText="No"
                                key="delete"
                            >
                                <Button 
                                    type="text" 
                                    danger
                                    icon={<Trash2 size={16} />}
                                />
                            </Popconfirm>
                        ]}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                                <Text strong style={{ color: '#e9edef' }}>{template.name}</Text>
                                <Tag color="blue">{template.shortcut}</Tag>
                            </Space>
                            <Tag color="green">{template.category}</Tag>
                            <Text 
                                style={{ 
                                    color: '#8696a0',
                                    fontSize: '13px',
                                    display: 'block',
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: '80px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {template.content}
                            </Text>
                            <Space>
                                <TrendingUp size={14} color="#8696a0" />
                                <Text style={{ color: '#8696a0', fontSize: '12px' }}>
                                    Usado {template.usageCount} veces
                                </Text>
                            </Space>
                        </Space>
                    </Card>
                ))}
            </div>

            {/* Modal para crear/editar plantilla */}
            <Modal
                title={editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setEditingTemplate(null);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText="Guardar"
                cancelText="Cancelar"
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSaveTemplate}
                >
                    <Form.Item
                        label="Nombre"
                        name="name"
                        rules={[{ required: true, message: 'Por favor ingresa un nombre' }]}
                    >
                        <Input placeholder="Ej: Saludo inicial" />
                    </Form.Item>

                    <Form.Item
                        label="Categoría"
                        name="category"
                        rules={[{ required: true, message: 'Por favor selecciona o crea una categoría' }]}
                    >
                        <Select
                            placeholder="Selecciona o escribe una nueva"
                            mode="tags"
                            maxCount={1}
                            options={categories.map(cat => ({ value: cat, label: cat }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Atajo"
                        name="shortcut"
                        rules={[{ required: true, message: 'Por favor ingresa un atajo' }]}
                    >
                        <Input placeholder="Ej: /hola" prefix="/" />
                    </Form.Item>

                    <Form.Item
                        label="Contenido"
                        name="content"
                        rules={[{ required: true, message: 'Por favor ingresa el contenido' }]}
                    >
                        <TextArea 
                            rows={6}
                            placeholder="Escribe el mensaje de la plantilla..."
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};
