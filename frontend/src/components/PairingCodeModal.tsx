import React, { useEffect, useMemo, useState } from 'react';
import { Button, Input, Modal, Space, Typography, message } from 'antd';
import { Copy } from 'lucide-react';
import { apiFetch } from '../lib/runtime';

const { Text } = Typography;

export const PairingCodeModal: React.FC<{
    open: boolean;
    deviceId: string;
    onClose: () => void;
}> = ({ open, deviceId, onClose }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [code, setCode] = useState<string | null>(null);
    const [cooldownUntil, setCooldownUntil] = useState<number>(0);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        if (!open) return;
        setPhoneNumber('');
        setCode(null);
        setLoading(false);
        setCooldownUntil(0);
    }, [open]);

    const remainingSeconds = useMemo(() => {
        if (!cooldownUntil) return 0;
        return Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
    }, [cooldownUntil, open]);

    useEffect(() => {
        if (!open) return;
        if (!cooldownUntil) return;
        if (remainingSeconds <= 0) return;
        const t = setInterval(() => {
            if (Date.now() >= cooldownUntil) setCooldownUntil(0);
        }, 250);
        return () => clearInterval(t);
    }, [open, cooldownUntil, remainingSeconds]);

    const canGenerate = !loading && remainingSeconds === 0;

    const requestCode = async () => {
        const cleaned = phoneNumber.replace(/[^\d]/g, '');
        if (cleaned.length < 8) {
            messageApi.error('Ingresá un número válido con código de país');
            return;
        }

        setLoading(true);
        try {
            const res = await apiFetch(`/api/devices/${deviceId}/pairing-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const errMsg = String(data?.error || 'Error al generar código');
                const m = errMsg.match(/Esperá\s+(\d+)s/i);
                if (res.status === 429 && m?.[1]) {
                    setCooldownUntil(Date.now() + Number(m[1]) * 1000);
                }
                throw new Error(errMsg);
            }
            setCode(String(data.code || ''));
        } catch (error: any) {
            const msg = String(error?.message || 'Error al generar código');
            if (msg.includes('Connection Closed')) {
                messageApi.error('No se pudo generar el código. Probá con QR.');
            } else {
                messageApi.error(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const copyCode = async () => {
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            messageApi.success('Código copiado');
        } catch {
            messageApi.error('No se pudo copiar el código');
        }
    };

    return (
        <Modal
            open={open}
            title="Vincular por código"
            onCancel={onClose}
            footer={
                <Space>
                    <Button onClick={onClose}>Cerrar</Button>
                    {code && (
                        <Button icon={<Copy size={16} />} onClick={copyCode}>
                            Copiar
                        </Button>
                    )}
                    <Button type="primary" loading={loading} onClick={requestCode} disabled={!canGenerate}>
                        {remainingSeconds > 0 ? `Esperá ${remainingSeconds}s` : 'Generar código'}
                    </Button>
                </Space>
            }
        >
            {contextHolder}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                    Ingresá el número con código de país. Ej: +59899... (Uy) o +54911...
                </Text>
                <Input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+59899369838"
                    autoFocus
                />
                {code && (
                    <div style={{ marginTop: 10 }}>
                        <div style={{ color: '#667781', fontSize: 12, marginBottom: 6 }}>Código</div>
                        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>{code}</div>
                        <div style={{ color: '#667781', fontSize: 12, marginTop: 6 }}>
                            WhatsApp {'>'} Dispositivos vinculados {'>'} Vincular con código
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
