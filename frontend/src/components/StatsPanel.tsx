import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Space, Progress } from 'antd';
import { MessageCircle, Users, FileText, Folder, TrendingUp, Activity } from 'lucide-react';
import { apiFetch } from '../lib/runtime';

const { Title } = Typography;

interface Stats {
    devices: {
        total: number;
        connected: number;
        disconnected: number;
    };
    messages: {
        total: number;
        sent: number;
        received: number;
    };
    files: {
        total: number;
        totalSize: string;
    };
    templates: {
        total: number;
        mostUsed: { name: string; count: number } | null;
    };
    labels: {
        total: number;
    };
}

export const StatsPanel: React.FC<{ deviceId?: string }> = ({ deviceId }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Actualizar cada 10 segundos
        return () => clearInterval(interval);
    }, [deviceId]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Obtener dispositivos
            const devicesRes = await apiFetch('/api/devices');
            const devices = await devicesRes.json();

            // Obtener archivos
            const filesRes = await apiFetch(`/api/storage/files${deviceId ? `?deviceId=${deviceId}` : ''}`);
            const files = await filesRes.json();

            // Obtener plantillas
            const templatesRes = await apiFetch('/api/templates');
            const templates = await templatesRes.json();

            // Obtener etiquetas
            const labelsRes = await apiFetch('/api/labels');
            const labels = await labelsRes.json();

            // Calcular estadísticas
            const totalSize = files.reduce((sum: number, f: any) => sum + f.size, 0);
            const mostUsedTemplate = templates.length > 0
                ? templates.reduce((prev: any, current: any) => 
                    (current.usageCount > prev.usageCount) ? current : prev
                  )
                : null;

            setStats({
                devices: {
                    total: devices.length,
                    connected: devices.filter((d: any) => d.status === 'CONNECTED').length,
                    disconnected: devices.filter((d: any) => d.status !== 'CONNECTED').length
                },
                messages: {
                    total: 0, // No hay sistema de tracking de mensajes aún
                    sent: 0,
                    received: 0
                },
                files: {
                    total: files.length,
                    totalSize: formatBytes(totalSize)
                },
                templates: {
                    total: templates.length,
                    mostUsed: mostUsedTemplate ? {
                        name: mostUsedTemplate.name,
                        count: mostUsedTemplate.usageCount
                    } : null
                },
                labels: {
                    total: labels.length
                }
            });
        } catch (err) {
            console.error('Error al cargar estadísticas:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    if (!stats) {
        return (
            <div style={{ padding: 40, textAlign: 'center', color: '#8696a0' }}>
                <Activity size={48} />
                <p>Cargando estadísticas...</p>
            </div>
        );
    }

    const deviceConnectivityRate = stats.devices.total > 0
        ? (stats.devices.connected / stats.devices.total) * 100
        : 0;

    return (
        <div style={{ padding: 20, background: '#0b141a', height: '100%', overflowY: 'auto' }}>
            <Title level={4} style={{ color: '#e9edef', marginBottom: 24 }}>
                📊 Estadísticas del Sistema
            </Title>

            <Row gutter={[16, 16]}>
                {/* Dispositivos */}
                <Col xs={24} sm={12} lg={8}>
                    <Card 
                        size="small"
                        style={{ background: '#111b21', borderColor: '#3b4a54' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                                <Users size={20} color="#25D366" />
                                <Title level={5} style={{ color: '#e9edef', margin: 0 }}>
                                    Dispositivos
                                </Title>
                            </Space>
                            <Statistic
                                value={stats.devices.total}
                                valueStyle={{ color: '#e9edef' }}
                                suffix="total"
                            />
                            <Space size="large">
                                <Statistic
                                    title="Conectados"
                                    value={stats.devices.connected}
                                    valueStyle={{ color: '#25D366', fontSize: '16px' }}
                                />
                                <Statistic
                                    title="Desconectados"
                                    value={stats.devices.disconnected}
                                    valueStyle={{ color: '#FF4444', fontSize: '16px' }}
                                />
                            </Space>
                            <div>
                                <p style={{ color: '#8696a0', fontSize: '12px', marginBottom: 8 }}>
                                    Tasa de conectividad
                                </p>
                                <Progress 
                                    percent={Math.round(deviceConnectivityRate)} 
                                    strokeColor="#25D366"
                                    trailColor="#3b4a54"
                                />
                            </div>
                        </Space>
                    </Card>
                </Col>

                {/* Archivos */}
                <Col xs={24} sm={12} lg={8}>
                    <Card 
                        size="small"
                        style={{ background: '#111b21', borderColor: '#3b4a54' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                                <Folder size={20} color="#3B82F6" />
                                <Title level={5} style={{ color: '#e9edef', margin: 0 }}>
                                    Archivos
                                </Title>
                            </Space>
                            <Statistic
                                value={stats.files.total}
                                valueStyle={{ color: '#e9edef' }}
                                suffix="archivos"
                            />
                            <Statistic
                                title="Tamaño Total"
                                value={stats.files.totalSize}
                                valueStyle={{ color: '#3B82F6', fontSize: '16px' }}
                            />
                        </Space>
                    </Card>
                </Col>

                {/* Plantillas */}
                <Col xs={24} sm={12} lg={8}>
                    <Card 
                        size="small"
                        style={{ background: '#111b21', borderColor: '#3b4a54' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                                <FileText size={20} color="#FFA500" />
                                <Title level={5} style={{ color: '#e9edef', margin: 0 }}>
                                    Plantillas
                                </Title>
                            </Space>
                            <Statistic
                                value={stats.templates.total}
                                valueStyle={{ color: '#e9edef' }}
                                suffix="disponibles"
                            />
                            {stats.templates.mostUsed && (
                                <div>
                                    <p style={{ color: '#8696a0', fontSize: '12px', marginBottom: 4 }}>
                                        Más usada:
                                    </p>
                                    <Space>
                                        <TrendingUp size={16} color="#25D366" />
                                        <span style={{ color: '#e9edef' }}>
                                            {stats.templates.mostUsed.name}
                                        </span>
                                        <span style={{ color: '#8696a0' }}>
                                            ({stats.templates.mostUsed.count}x)
                                        </span>
                                    </Space>
                                </div>
                            )}
                        </Space>
                    </Card>
                </Col>

                {/* Etiquetas */}
                <Col xs={24} sm={12} lg={8}>
                    <Card 
                        size="small"
                        style={{ background: '#111b21', borderColor: '#3b4a54' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                                <MessageCircle size={20} color="#FFD700" />
                                <Title level={5} style={{ color: '#e9edef', margin: 0 }}>
                                    Etiquetas
                                </Title>
                            </Space>
                            <Statistic
                                value={stats.labels.total}
                                valueStyle={{ color: '#e9edef' }}
                                suffix="categorías"
                            />
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};
