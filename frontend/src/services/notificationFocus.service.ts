let chatOpen = false;
let activeBranchId: string | null = null;
let activeChatId: string | null = null;

export const setChatOpen = (open: boolean) => {
    chatOpen = open;
};

export const setActiveBranchId = (branchId: string | null) => {
    activeBranchId = branchId;
};

export const setActiveChatId = (chatId: string | null) => {
    activeChatId = chatId;
};

export const isChatInFocus = (branchId: string | null | undefined, chatId: string | null | undefined) => {
    if (!branchId || !chatId) return false;
    if (!chatOpen) return false;
    if (activeBranchId !== branchId) return false;
    if (activeChatId !== chatId) return false;
    try {
        return document.visibilityState === 'visible';
    } catch {
        return true;
    }
};
