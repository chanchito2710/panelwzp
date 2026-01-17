import { useEffect, useState } from 'react';

export const useNotifications = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result;
        }
        return 'denied';
    };

    const showNotification = (title: string, options?: NotificationOptions) => {
        if (permission === 'granted') {
            const notification = new Notification(title, {
                icon: '/whatsapp-icon.png',
                badge: '/whatsapp-icon.png',
                ...options
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } else if (permission === 'default') {
            requestPermission();
        }
    };

    const showMessageNotification = (from: string, message: string, chatId?: string) => {
        return showNotification(`Nuevo mensaje de ${from}`, {
            body: message,
            tag: chatId || from,
            requireInteraction: false,
            silent: false
        });
    };

    return {
        permission,
        requestPermission,
        showNotification,
        showMessageNotification,
        isSupported: 'Notification' in window
    };
};
