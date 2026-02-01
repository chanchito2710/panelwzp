let chatOpen = false;
let activeChatId: string | null = null;

export const setChatOpen = (open: boolean) => {
    chatOpen = open;
};

export const setActiveChatId = (chatId: string | null) => {
    activeChatId = chatId;
};

export const isChatInFocus = (chatId: string | null | undefined) => {
    if (!chatId) return false;
    if (!chatOpen) return false;
    if (activeChatId !== chatId) return false;
    try {
        return document.visibilityState === 'visible';
    } catch {
        return true;
    }
};

