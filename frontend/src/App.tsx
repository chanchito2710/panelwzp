import React, { useState } from 'react';
import { Button, ConfigProvider, theme } from 'antd';
import { MessageSquare } from 'lucide-react';
import { WhatsAppPanelModal } from './components/WhatsAppPanelModal';
import { Login } from './components/Login';
import { clearAuthToken, getAuthToken } from './lib/auth';

function App() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [authed, setAuthed] = useState(() => Boolean(getAuthToken()));

    if (!authed) {
        return <Login onLoggedIn={() => setAuthed(true)} />;
    }

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
                token: {
                    colorPrimary: '#25D366',
                    borderRadius: 8,
                },
            }}
        >
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0b141a',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h1 style={{ color: '#e9edef', margin: 0 }}>WhatsApp</h1>
                    <p style={{ color: '#8696a0' }}>Gestión Multi-Dispositivo para Sucursales</p>
                </div>

                <Button
                    type="primary"
                    size="large"
                    icon={<MessageSquare size={18} />}
                    onClick={() => setIsModalOpen(true)}
                    style={{ height: '50px', borderRadius: '25px', padding: '0 30px', fontWeight: 'bold' }}
                >
                    Abrir Panel WhatsApp
                </Button>
                <Button
                    type="text"
                    onClick={() => {
                        clearAuthToken();
                        setAuthed(false);
                    }}
                    style={{ color: '#8696a0' }}
                >
                    Cerrar sesión
                </Button>

                <WhatsAppPanelModal
                    visible={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </div>
        </ConfigProvider>
    );
}

export default App;
