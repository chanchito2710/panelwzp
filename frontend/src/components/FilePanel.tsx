import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Typography, Modal, Input, Select } from 'antd';
import { FileText, Image as ImageIcon, Music, Download, Trash2, RefreshCw, Search } from 'lucide-react';
import { apiFetch, assetUrl } from '../lib/runtime';

const { Text } = Typography;

export const FilePanel = ({ deviceId }: { deviceId: string | undefined }) => {
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');

    const fetchFiles = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/api/storage/files?deviceId=${deviceId}`);
            const data = await res.json();
            setFiles(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [deviceId]);

    // Filtrar archivos
    const filteredFiles = files.filter(file => {
        // Filtro por término de búsqueda
        const matchesSearch = !searchTerm || 
            file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.chatId.toLowerCase().includes(searchTerm.toLowerCase());

        // Filtro por tipo de archivo
        const matchesType = fileTypeFilter === 'all' || 
            (fileTypeFilter === 'image' && file.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ||
            (fileTypeFilter === 'document' && file.fileName.match(/\.(pdf|doc|docx|txt)$/i)) ||
            (fileTypeFilter === 'audio' && file.fileName.match(/\.(mp3|wav|ogg|webm|m4a)$/i)) ||
            (fileTypeFilter === 'video' && file.fileName.match(/\.(mp4|avi|mov|webm)$/i));

        return matchesSearch && matchesType;
    });

    const columns = [
        {
            title: 'Archivo',
            dataIndex: 'fileName',
            key: 'fileName',
            render: (text: string, record: any) => (
                <Space>
                    {record.mimeType?.includes('image') ? <ImageIcon size={16} /> : record.mimeType?.includes('audio') ? <Music size={16} /> : <FileText size={16} />}
                    <Text strong>{text}</Text>
                </Space>
            )
        },
        {
            title: 'Chat',
            dataIndex: 'chatId',
            key: 'chatId',
            render: (text: string) => <Tag color="blue">{text.includes('@g.us') ? '👥 Grupo' : '💬 Privado'}</Tag>
        },
        {
            title: 'Tamaño',
            dataIndex: 'size',
            key: 'size',
            render: (size: number) => `${(size / 1024).toFixed(1)} KB`
        },
        {
            title: 'Fecha',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (ms: number) => new Date(ms).toLocaleString()
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_: any, record: any) => (
                <Space>
                    <Button type="text" icon={<Download size={16} />} onClick={() => window.open(assetUrl(String(record.url || '')))} />
                    <Button type="text" danger icon={<Trash2 size={16} />} />
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 20, background: '#0b141a', height: '100%', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
                <Typography.Title level={4} style={{ color: '#e9edef', margin: 0 }}>Archivos y Comprobantes</Typography.Title>
                <Button icon={<RefreshCw size={16} />} onClick={fetchFiles} loading={loading}>Actualizar</Button>
            </div>

            {/* Barra de búsqueda y filtros */}
            <Space direction="vertical" style={{ width: '100%', marginBottom: 20 }}>
                <Space style={{ width: '100%' }}>
                    <Input
                        prefix={<Search size={16} />}
                        placeholder="Buscar por nombre de archivo o chat..."
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
                        value={fileTypeFilter}
                        onChange={setFileTypeFilter}
                        style={{ width: 150 }}
                        options={[
                            { value: 'all', label: '📁 Todos' },
                            { value: 'image', label: '🖼️ Imágenes' },
                            { value: 'document', label: '📄 Documentos' },
                            { value: 'audio', label: '🎵 Audio' },
                            { value: 'video', label: '🎥 Videos' }
                        ]}
                    />
                    <Tag color="blue">{filteredFiles.length} archivo(s)</Tag>
                </Space>
            </Space>

            <Table
                dataSource={filteredFiles}
                columns={columns}
                loading={loading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                style={{ background: '#111b21' }}
                rowClassName={() => 'dark-row'}
            />
        </div>
    );
};
