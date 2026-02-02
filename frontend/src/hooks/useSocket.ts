import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE, SOCKET_URL } from '../lib/runtime';
import { getAuthToken } from '../lib/auth';

export const useSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [token, setToken] = useState(() => getAuthToken());

    useEffect(() => {
        const id = window.setInterval(() => {
            const next = getAuthToken();
            setToken((prev) => (prev === next ? prev : next));
        }, 1000);
        return () => {
            window.clearInterval(id);
        };
    }, []);

    useEffect(() => {
        const url = SOCKET_URL || API_BASE || undefined;
        if (!token) {
            setSocket(null);
            return;
        }
        const newSocket = url ? io(url, { auth: { token } }) : io({ auth: { token } });
        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [API_BASE, SOCKET_URL, token]);

    return socket;
};
