import React, { useState } from 'react';
import { Button, Input, Modal, Space, Typography, message } from 'antd';
import { apiFetch } from '../lib/runtime';

const { Text } = Typography;

export const GlobalSecurityModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const submitPasswordChange = async () => {
        if (changingPassword) return;
        if (!currentPassword.trim()) {
            messageApi.error('Ingresá tu contraseña actual');
            return;
        }
        if (newPassword.trim().length < 4) {
            messageApi.error('La nueva contraseña debe tener al menos 4 caracteres');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            messageApi.error('Las contraseñas no coinciden');
            return;
        }

        setChangingPassword(true);
        try {
            const res = await apiFetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(String(data?.error || 'Error al cambiar contraseña'));
            messageApi.success('Contraseña actualizada');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            onClose();
        } catch (error: any) {
            messageApi.error(String(error?.message || 'Error al cambiar contraseña'));
        } finally {
            setChangingPassword(false);
        }
    };

    return (
        <Modal open={open} title="Seguridad" onCancel={onClose} footer={null} width={420}>
            {contextHolder}
            <Typography.Title level={5}>Contraseña</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Input.Password
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Contraseña actual"
                    autoComplete="current-password"
                />
                <Input.Password
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nueva contraseña"
                    autoComplete="new-password"
                />
                <Input.Password
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirmar nueva contraseña"
                    autoComplete="new-password"
                    onPressEnter={submitPasswordChange}
                />
                <Button type="primary" onClick={submitPasswordChange} loading={changingPassword}>
                    Cambiar contraseña
                </Button>
                <Text style={{ color: '#8696a0', fontSize: 12 }}>
                    La contraseña aplica a toda la aplicación.
                </Text>
            </Space>
        </Modal>
    );
};

