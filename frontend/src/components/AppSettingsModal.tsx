import React, { useRef, useState } from 'react';
import { Button, Divider, Input, Modal, Radio, Space, Typography, message } from 'antd';
import { Play } from 'lucide-react';
import { apiFetch } from '../lib/runtime';

const { Text } = Typography;

export const AppSettingsModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const notificationAudioCtxRef = useRef<AudioContext | null>(null);
    const [selectedTone, setSelectedTone] = useState<number>(() => {
        const saved = localStorage.getItem('notificationTone');
        return saved ? parseInt(saved, 10) : 1;
    });

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    const playNotificationSound = (toneId: number = selectedTone) => {
        try {
            if (toneId === 11) {
                const audio = new Audio('https://www.myinstants.com/media/sounds/sape.mp3');
                audio.volume = 0.5;
                audio.play().catch(() => {});
                return;
            }

            if (!notificationAudioCtxRef.current) {
                notificationAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const audioCtx = notificationAudioCtxRef.current;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
            if (audioCtx.state !== 'running') return;
            const now = audioCtx.currentTime;

            const createOsc = (type: OscillatorType, freq: number, start: number, dur: number, vol: number = 0.1) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(vol, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start(start);
                osc.stop(start + dur);
            };

            switch (toneId) {
                case 1:
                    createOsc('sine', 880, now, 0.08, 0.08);
                    createOsc('sine', 660, now + 0.09, 0.08, 0.08);
                    break;
                case 2:
                    createOsc('triangle', 1046, now, 0.06, 0.06);
                    createOsc('triangle', 1318, now + 0.07, 0.06, 0.06);
                    break;
                case 3:
                    createOsc('sine', 740, now, 0.05, 0.06);
                    createOsc('sine', 988, now + 0.06, 0.05, 0.06);
                    break;
                case 4:
                    createOsc('square', 523, now, 0.06, 0.04);
                    createOsc('square', 659, now + 0.07, 0.06, 0.04);
                    break;
                case 5:
                    createOsc('sine', 880, now, 0.06, 0.07);
                    createOsc('sine', 1174, now + 0.07, 0.09, 0.07);
                    break;
                case 6:
                    createOsc('sawtooth', 1200, now, 0.05, 0.05);
                    createOsc('sawtooth', 900, now + 0.05, 0.05, 0.05);
                    break;
                case 7:
                    createOsc('triangle', 988, now, 0.04, 0.05);
                    createOsc('triangle', 740, now + 0.05, 0.04, 0.05);
                    break;
                case 8:
                    createOsc('sine', 660, now, 0.05, 0.05);
                    createOsc('sine', 880, now + 0.06, 0.05, 0.05);
                    break;
                case 9:
                    createOsc('triangle', 880, now, 0.06, 0.06);
                    createOsc('triangle', 1320, now + 0.07, 0.08, 0.06);
                    break;
                case 10:
                    createOsc('sine', 220, now, 0.12, 0.1);
                    break;
                case 12: {
                    const freqs = [1568, 1760, 1976];
                    freqs.forEach((f, idx) => createOsc('sine', f, now + idx * 0.03, 0.03, 0.04));
                    break;
                }
                default:
                    createOsc('sine', 880, now, 0.08, 0.08);
            }
        } catch {}
    };

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
        <Modal open={open} title="Configuración" onCancel={onClose} footer={null} width={420}>
            {contextHolder}
            <Typography.Title level={5}>Tono de notificación</Typography.Title>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                <Radio.Group
                    onChange={(e) => {
                        const val = e.target.value;
                        setSelectedTone(val);
                        localStorage.setItem('notificationTone', val.toString());
                        playNotificationSound(val);
                    }}
                    value={selectedTone}
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                    {[
                        { id: 1, name: 'Beep' },
                        { id: 2, name: 'Crystal' },
                        { id: 3, name: 'Bubble' },
                        { id: 4, name: 'Notification' },
                        { id: 5, name: 'Success' },
                        { id: 6, name: 'Laser' },
                        { id: 7, name: 'Coin' },
                        { id: 8, name: 'Pluck' },
                        { id: 9, name: 'Chime' },
                        { id: 10, name: 'Deep' },
                        { id: 11, name: 'Sapeee (Bananero)' },
                        { id: 12, name: 'Bird (Ave)' }
                    ].map(tone => (
                        <div key={tone.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#202c33', borderRadius: 8, border: '1px solid #2a3942' }}>
                            <Radio value={tone.id} style={{ color: '#e9edef' }}>{tone.name}</Radio>
                            <Button
                                size="small"
                                icon={<Play size={14} color="#8696a0" />}
                                type="text"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playNotificationSound(tone.id);
                                }}
                            />
                        </div>
                    ))}
                </Radio.Group>
            </div>
            <Divider />
            <Typography.Title level={5}>Seguridad</Typography.Title>
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
                    Esta contraseña es la del login del sistema (admin).
                </Text>
            </Space>
        </Modal>
    );
};

