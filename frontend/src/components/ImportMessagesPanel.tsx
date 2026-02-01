import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Typography, message } from 'antd';
import { Download } from 'lucide-react';
import { apiFetch } from '../lib/runtime';

const { Text, Title } = Typography;

export const ImportMessagesPanel = ({ deviceId, onImported }: { deviceId: string; onImported?: () => void }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [checking, setChecking] = useState(false);
    const [importing, setImporting] = useState(false);
    const [summary, setSummary] = useState<{ totalMessages: number; chatsWithMessages: number } | null>(null);

    const refreshSummary = async () => {
        setChecking(true);
        try {
            const res = await apiFetch(`/api/devices/${deviceId}/messages/summary`);
            const data = await res.json().catch(() => null);
            if (data && typeof data.totalMessages === 'number') {
                setSummary({ totalMessages: Number(data.totalMessages || 0), chatsWithMessages: Number(data.chatsWithMessages || 0) });
            } else {
                setSummary(null);
            }
        } catch {
            setSummary(null);
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        void refreshSummary();
    }, [deviceId]);

    const doImport = async () => {
        setImporting(true);
        const key = `import-${deviceId}`;
        try {
            messageApi.loading({ content: 'Importando mensajes...', key });
            const res = await apiFetch(`/api/devices/${deviceId}/import-messages`, { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || 'Error al importar');
            if (data?.success) {
                messageApi.success({ content: `Mensajes importados: ${Number(data?.totalMessages || 0)}`, key });
            } else {
                messageApi.warning({ content: data?.error || 'No se pudieron importar mensajes', key });
            }
            await refreshSummary();
            onImported?.();
        } catch (e: any) {
            messageApi.error({ content: String(e?.message || 'Error al importar'), key });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            {contextHolder}
            <Card style={{ background: '#111b21', borderColor: '#222e35' }}>
                <Title level={4} style={{ color: '#e9edef', marginTop: 0 }}>
                    <Space>
                        <Download size={18} />
                        Importar mensajes
                    </Space>
                </Title>
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    <Text style={{ color: '#8696a0' }}>
                        Importa todos los mensajes posibles desde el dispositivo (según el máximo que WhatsApp permita).
                    </Text>
                    <Text style={{ color: '#8696a0' }}>
                        Solo se habilita si el dispositivo está vacío en el panel.
                    </Text>
                    <Space wrap>
                        <Button onClick={() => void refreshSummary()} loading={checking}>
                            Rechequear
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => void doImport()}
                            disabled={checking || importing || !summary || summary.totalMessages > 0}
                            loading={importing}
                        >
                            Importar ahora
                        </Button>
                    </Space>
                    {summary && summary.totalMessages === 0 && <Text style={{ color: '#00a884' }}>Dispositivo vacío: importación habilitada.</Text>}
                    {summary && summary.totalMessages > 0 && <Text style={{ color: '#faad14' }}>Este dispositivo ya tiene mensajes importados.</Text>}
                    {!summary && <Text style={{ color: '#8696a0' }}>No se pudo validar si está vacío.</Text>}
                </Space>
            </Card>
        </div>
    );
};
