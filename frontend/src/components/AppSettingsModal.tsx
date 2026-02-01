import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Divider, Input, Modal, Radio, Select, Slider, Space, Switch, Typography, message } from 'antd';
import { Play } from 'lucide-react';
import { apiFetch } from '../lib/runtime';
import { getNotificationSettings, isTtsIntroSeen, markTtsIntroSeen, setNotificationSettings, subscribeNotificationSettings } from '../services/notificationSettings.service';
import { playNotificationTone, unlockNotificationAudio } from '../services/notificationSound.service';
import { getTtsVoices, initTts, speakTts } from '../services/tts.service';

const { Text } = Typography;

export const AppSettingsModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [settings, setSettings] = useState(getNotificationSettings());
    const [showTtsIntro, setShowTtsIntro] = useState(false);
    const prevTtsEnabledRef = useRef<boolean>(settings.ttsEnabled);
    const [voicesVersion, setVoicesVersion] = useState(0);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        return subscribeNotificationSettings((s) => {
            prevTtsEnabledRef.current = s.ttsEnabled;
            setSettings(s);
        });
    }, []);

    useEffect(() => {
        if (!open) return;
        initTts();
        const bump = () => setVoicesVersion(v => v + 1);
        try {
            window.speechSynthesis?.addEventListener?.('voiceschanged', bump);
        } catch {}
        const t = setTimeout(bump, 200);
        return () => {
            clearTimeout(t);
            try {
                window.speechSynthesis?.removeEventListener?.('voiceschanged', bump);
            } catch {}
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        if (prevTtsEnabledRef.current === false && settings.ttsEnabled === true && !isTtsIntroSeen()) {
            setShowTtsIntro(true);
        }
        prevTtsEnabledRef.current = settings.ttsEnabled;
    }, [open, settings.ttsEnabled]);

    const toneVolumePercent = useMemo(() => Math.round((settings.toneVolume || 0) * 100), [settings.toneVolume]);

    const voices = useMemo(() => {
        void voicesVersion;
        return getTtsVoices();
    }, [voicesVersion]);

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
            <Typography.Title level={5}>Notificaciones</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#e9edef' }}>Modo silencio</Text>
                    <Switch checked={settings.silentMode} onChange={(v) => setNotificationSettings({ silentMode: v })} />
                </div>
                <Divider style={{ margin: '6px 0' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#e9edef' }}>Reproducir tono al llegar mensaje</Text>
                    <Switch checked={settings.toneEnabled} onChange={(v) => setNotificationSettings({ toneEnabled: v })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#e9edef' }}>Sonar incluso si estoy viendo el chat</Text>
                    <Switch checked={settings.playToneWhileChatOpen} onChange={(v) => setNotificationSettings({ playToneWhileChatOpen: v })} />
                </div>
                <div>
                    <Text style={{ color: '#e9edef' }}>Volumen</Text>
                    <Slider
                        min={0}
                        max={100}
                        value={toneVolumePercent}
                        onChange={(v) => setNotificationSettings({ toneVolume: Number(v) / 100 })}
                    />
                </div>
            </Space>
            <Divider />
            <Typography.Title level={5}>Tono</Typography.Title>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                <Radio.Group
                    onChange={(e) => {
                        const val = e.target.value;
                        localStorage.setItem('notificationTone', String(val));
                        setNotificationSettings({ toneId: val });
                        unlockNotificationAudio();
                        playNotificationTone({ toneId: val, volume: settings.toneVolume });
                    }}
                    value={settings.toneId}
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
                                    unlockNotificationAudio();
                                    playNotificationTone({ toneId: tone.id, volume: settings.toneVolume });
                                }}
                            />
                        </div>
                    ))}
                </Radio.Group>
            </div>
            <Divider />
            <Typography.Title level={5}>Lectura por voz</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }} size={10}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#e9edef' }}>Leer nombre del contacto al llegar mensaje</Text>
                    <Switch
                        checked={settings.ttsEnabled}
                        onChange={(v) => {
                            setNotificationSettings({ ttsEnabled: v });
                            if (v) initTts();
                        }}
                    />
                </div>
                <div>
                    <Text style={{ color: '#e9edef' }}>Voz</Text>
                    <Select
                        value={settings.ttsVoiceURI || 'auto'}
                        onChange={(v) => setNotificationSettings({ ttsVoiceURI: v === 'auto' ? null : String(v) })}
                        style={{ width: '100%' }}
                        options={[
                            { value: 'auto', label: 'Auto' },
                            ...voices.map(v => ({ value: v.voiceURI, label: `${v.name} (${v.lang})` }))
                        ]}
                    />
                </div>
                <div>
                    <Text style={{ color: '#e9edef' }}>Idioma</Text>
                    <Select
                        value={settings.ttsLang || 'auto'}
                        onChange={(v) => setNotificationSettings({ ttsLang: String(v) })}
                        style={{ width: '100%' }}
                        options={[
                            { value: 'auto', label: 'Auto' },
                            { value: 'es-UY', label: 'es-UY' },
                            { value: 'es-AR', label: 'es-AR' },
                            { value: 'es-ES', label: 'es-ES' }
                        ]}
                    />
                </div>
                <div>
                    <Text style={{ color: '#e9edef' }}>Velocidad</Text>
                    <Slider min={60} max={160} value={Math.round(settings.ttsRate * 100)} onChange={(v) => setNotificationSettings({ ttsRate: Number(v) / 100 })} />
                </div>
                <div>
                    <Text style={{ color: '#e9edef' }}>Tono</Text>
                    <Slider min={0} max={200} value={Math.round(settings.ttsPitch * 100)} onChange={(v) => setNotificationSettings({ ttsPitch: Number(v) / 100 })} />
                </div>
                <div>
                    <Text style={{ color: '#e9edef' }}>Decir</Text>
                    <Select
                        value={settings.ttsFormat}
                        onChange={(v) => setNotificationSettings({ ttsFormat: v === 'name' ? 'name' : 'messageOf' })}
                        style={{ width: '100%' }}
                        options={[
                            { value: 'messageOf', label: 'Mensaje de {NOMBRE}' },
                            { value: 'name', label: '{NOMBRE}' }
                        ]}
                    />
                </div>
                <div>
                    <Text style={{ color: '#e9edef' }}>Si no hay nombre</Text>
                    <Select
                        value={settings.ttsUnknownNameMode}
                        onChange={(v) => setNotificationSettings({ ttsUnknownNameMode: v === 'number' ? 'number' : 'unknown' })}
                        style={{ width: '100%' }}
                        options={[
                            { value: 'unknown', label: 'Número desconocido' },
                            { value: 'number', label: 'Leer número' }
                        ]}
                    />
                </div>
                <Button
                    onClick={() => {
                        unlockNotificationAudio();
                        playNotificationTone({ toneId: settings.toneId, volume: settings.toneVolume });
                        speakTts(settings.ttsFormat === 'name' ? 'Juan Pérez' : 'Mensaje de Juan Pérez', {
                            voiceURI: settings.ttsVoiceURI || undefined,
                            lang: settings.ttsLang === 'auto' ? null : settings.ttsLang,
                            rate: settings.ttsRate,
                            pitch: settings.ttsPitch,
                            volume: 1
                        });
                    }}
                >
                    Probar
                </Button>
            </Space>
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
            <Modal
                open={showTtsIntro}
                title="Habilitar lectura por voz"
                onCancel={() => {
                    setShowTtsIntro(false);
                    setNotificationSettings({ ttsEnabled: false });
                }}
                footer={[
                    <Button
                        key="test"
                        onClick={() => {
                            unlockNotificationAudio();
                            playNotificationTone({ toneId: settings.toneId, volume: settings.toneVolume });
                            speakTts(settings.ttsFormat === 'name' ? 'Juan Pérez' : 'Mensaje de Juan Pérez', {
                                voiceURI: settings.ttsVoiceURI || undefined,
                                lang: settings.ttsLang === 'auto' ? null : settings.ttsLang,
                                rate: settings.ttsRate,
                                pitch: settings.ttsPitch,
                                volume: 1
                            });
                        }}
                    >
                        Probar
                    </Button>,
                    <Button
                        key="ok"
                        type="primary"
                        onClick={() => {
                            markTtsIntroSeen();
                            setShowTtsIntro(false);
                        }}
                    >
                        Entendido
                    </Button>
                ]}
            >
                <Text style={{ color: '#8696a0' }}>
                    La lectura por voz depende del navegador y puede requerir una interacción (click/tecla) para habilitar audio.
                </Text>
            </Modal>
        </Modal>
    );
};
