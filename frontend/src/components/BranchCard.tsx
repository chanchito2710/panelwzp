import React, { useState, useEffect, useRef } from 'react';
import { Card, Badge, Avatar, List, Typography, Button, Spin } from 'antd';
import { MessageSquare, Maximize2 } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { apiFetch, assetUrl } from '../lib/runtime';
import { upsertBranchChats } from '../services/branchChatDirectory.service';

const { Text } = Typography;

// Inyectar estilos de animación para las tarjetas de dispositivos
const injectBranchCardStyles = () => {
    const styleId = 'branch-card-animations';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Animación de zumbido/vibración para BranchCard */
        @keyframes branchCardBuzz {
            0%, 100% { transform: translateY(-8px); }
            10% { transform: translateY(-8px) translateX(-4px) rotate(-1deg); }
            20% { transform: translateY(-8px) translateX(4px) rotate(1deg); }
            30% { transform: translateY(-8px) translateX(-4px) rotate(-1deg); }
            40% { transform: translateY(-8px) translateX(4px) rotate(1deg); }
            50% { transform: translateY(-8px) translateX(-2px); }
            60% { transform: translateY(-8px) translateX(2px); }
            70% { transform: translateY(-8px) translateX(-1px); }
            80% { transform: translateY(-8px) translateX(1px); }
            90% { transform: translateY(-8px); }
        }
        
        /* Animación de pulso de color */
        @keyframes branchCardPulse {
            0%, 100% { box-shadow: 0 8px 25px rgba(0, 168, 132, 0.3); }
            50% { box-shadow: 0 8px 35px rgba(0, 168, 132, 0.6), 0 0 20px rgba(37, 211, 102, 0.4); }
        }
        
        /* Clase base para hover */
        .branch-card-animated {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        
        .branch-card-animated:hover {
            transform: translateY(-8px) !important;
            box-shadow: 0 12px 30px rgba(0, 168, 132, 0.25) !important;
        }
        
        /* Clase para notificación activa */
        .branch-card-notified {
            animation: branchCardBuzz 0.6s ease-in-out, branchCardPulse 1.5s ease-in-out !important;
            border-color: #25D366 !important;
            box-shadow: 0 8px 30px rgba(37, 211, 102, 0.4) !important;
        }
        
        .branch-card-notified::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: inherit;
            background: linear-gradient(45deg, transparent, rgba(37, 211, 102, 0.1), transparent);
            animation: shimmer 1s ease-in-out;
            pointer-events: none;
        }
        
        @keyframes shimmer {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
        }
    `;
    document.head.appendChild(style);
};

interface Device {
    id: string;
    name: string;
    status: string;
    phoneNumber?: string | null;
    number?: string | null;
}

interface Chat {
    id: string;
    name: string;
    lastMessageTime: number;
    unreadCount: number;
    isGroup: boolean;
    profilePhotoUrl?: string | null;
}

interface BranchCardProps {
    device: Device;
    onOpenFull: () => void;
    onRename?: (name: string) => void;
    headerActions?: React.ReactNode;
    onPin?: () => void;
    isPinned?: boolean;
    dragHandle?: React.ReactNode;
}

export const BranchCard: React.FC<BranchCardProps> = ({ device, onOpenFull, onRename, headerActions, onPin, isPinned, dragHandle }) => {
    const socket = useSocket();
    const [chats, setChats] = useState<Chat[]>([]);
    const [totalUnread, setTotalUnread] = useState(0);
    const [isNotified, setIsNotified] = useState(false);
    const chatsRef = useRef<Chat[]>([]);
    
    // Inyectar estilos de animación
    useEffect(() => {
        injectBranchCardStyles();
    }, []);
    
    useEffect(() => {
        chatsRef.current = chats;
    }, [chats]);

    // Cargar chats
    useEffect(() => {
        const fetchChats = async () => {
            if (device.status !== 'CONNECTED') return;
            try {
                const res = await apiFetch(`/api/devices/${device.id}/chats`);
                const text = await res.text();
                const data = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
                if (!res.ok) {
                    setChats([]);
                    setTotalUnread(0);
                    return;
                }
                if (Array.isArray(data)) {
                    upsertBranchChats(device.id, data);
                    setChats(data.slice(0, 5)); // Solo los 5 más recientes
                    setTotalUnread(data.reduce((sum: number, c: Chat) => sum + (c.unreadCount || 0), 0));
                }
            } catch (error) {
                console.error('Error:', error);
            }
        };
        
        fetchChats();
        const interval = setInterval(fetchChats, 10000);
        return () => clearInterval(interval);
    }, [device.id, device.status]);

    // Socket para mensajes nuevos
    useEffect(() => {
        if (!socket) return;
        
        const handleNewMessage = (data: any) => {
            if (data.deviceId === device.id && !data.msg.fromMe) {
                setTotalUnread(prev => prev + 1);
                
                // Activar animación de notificación
                setIsNotified(true);
                setTimeout(() => setIsNotified(false), 1500);
            }
        };

        const handleUnreadUpdate = (data: any) => {
            if (data.deviceId !== device.id) return;
            if (typeof data.totalUnread === 'number') {
                setTotalUnread(data.totalUnread);
            }
        };
        
        socket.on('message:new', handleNewMessage);
        socket.on('device:unread:update', handleUnreadUpdate);
        return () => { 
            socket.off('message:new', handleNewMessage); 
            socket.off('device:unread:update', handleUnreadUpdate);
        };
    }, [socket, device.id]);

    const isConnected = device.status === 'CONNECTED';
    const isReconnecting = device.status === 'RECONNECTING';
    const nameEditable = onRename
        ? {
            onChange: (value: string) => onRename(value),
            triggerType: ['icon'] as ('text' | 'icon')[],
            tooltip: 'Editar nombre',
            maxLength: 60
        }
        : false;

    return (
        <Card
            hoverable
            onClick={onOpenFull}
            className={`branch-card-animated ${isNotified ? 'branch-card-notified' : ''}`}
            style={{
                background: '#111b21',
                borderColor: isNotified ? '#25D366' : (isConnected ? '#00a884' : '#3b4a54'),
                borderWidth: isConnected ? 2 : 1,
                cursor: 'pointer',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
            }}
            styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' } }}
        >
            {/* Header */}
            <div style={{
                padding: '10px 12px',
                background: isConnected ? '#00a884' : isReconnecting ? '#1a5f4a' : '#202c33',
                borderBottom: '1px solid #222e35',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isReconnecting ? (
                        <Spin size="small" />
                    ) : (
                        <Badge status={isConnected ? 'success' : 'default'} />
                    )}
                    <div>
                        <div onClick={(e) => e.stopPropagation()}>
                            <Text strong style={{ color: '#fff', fontSize: 13 }} editable={nameEditable}>
                                {device.name}
                            </Text>
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                            {isConnected 
                                ? (device.phoneNumber || device.number || 'Conectado')
                                : isReconnecting
                                    ? 'Reconectando...'
                                    : device.status === 'QR_READY' ? 'Escanear QR' : 'Sin vincular'
                            }
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {dragHandle}
                    {onPin && (
                        <Button
                            type="text"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPin();
                            }}
                            icon={
                                <div style={{ 
                                    transform: isPinned ? 'rotate(45deg)' : 'rotate(0deg)', 
                                    transition: 'transform 0.2s',
                                    color: isConnected ? '#fff' : (isPinned ? '#00a884' : '#8696a0') 
                                }}>
                                    📌
                                </div>
                            }
                            style={{ padding: 0, minWidth: 24 }}
                            title={isPinned ? "Desfijar" : "Fijar al inicio"}
                        />
                    )}
                    {isConnected && totalUnread > 0 && (
                        <Badge
                            count={totalUnread}
                            size="small"
                            style={{ backgroundColor: '#00a884', boxShadow: '0 0 0 1px #111b21' }}
                        />
                    )}
                    <div onClick={(e) => e.stopPropagation()}>{headerActions}</div>
                </div>
            </div>

            {/* Chats Preview */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {!isConnected ? (
                    <div style={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: isReconnecting ? '#25D366' : '#8696a0',
                        fontSize: 12,
                        padding: 20,
                        textAlign: 'center',
                        gap: 8
                    }}>
                        {isReconnecting ? (
                            <>
                                <Spin />
                                <span>Reconectando sesión...</span>
                            </>
                        ) : device.status === 'QR_READY' 
                            ? 'Haz clic para escanear QR'
                            : 'Haz clic para conectar'
                        }
                    </div>
                ) : chats.length === 0 ? (
                    <div style={{ 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: '#8696a0',
                        fontSize: 12
                    }}>
                        Sin chats recientes
                    </div>
                ) : (
                    <List
                        size="small"
                        dataSource={chats}
                        renderItem={chat => (
                            <List.Item style={{ 
                                padding: '6px 10px', 
                                borderBottom: '1px solid #222e35',
                                background: 'transparent'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                                    <Avatar size="small" shape="square" src={chat.profilePhotoUrl ? assetUrl(chat.profilePhotoUrl) : undefined} style={{ backgroundColor: chat.isGroup ? '#25D366' : '#6a7175', flexShrink: 0 }}>
                                        {chat.name.substring(0, 1).toUpperCase()}
                                    </Avatar>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ 
                                            fontSize: 11, 
                                            color: '#e9edef',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {chat.name}
                                        </div>
                                        <div style={{ fontSize: 9, color: '#8696a0' }}>
                                            {new Date(chat.lastMessageTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                )}
            </div>

            {/* Footer */}
            <div style={{
                padding: '8px 10px',
                background: '#202c33',
                borderTop: '1px solid #222e35',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Button 
                    type="text" 
                    size="small"
                    icon={<Maximize2 size={14} />}
                    style={{ color: '#00a884', fontSize: 11 }}
                >
                    Abrir completo
                </Button>
            </div>
        </Card>
    );
};
