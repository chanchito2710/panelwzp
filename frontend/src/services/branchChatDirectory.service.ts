type BranchChatDirectory = Record<string, Record<string, string>>;

let store: BranchChatDirectory = {};

const getChatKey = (chatId: string) => {
    if (!chatId) return '';
    if (chatId.includes('@g.us')) return chatId;
    const prefix = chatId.split('@')[0] || chatId;
    return prefix.split(':')[0] || prefix;
};

export const upsertBranchChats = (branchId: string, chats: Array<{ id: string; name: string }>) => {
    const id = String(branchId || '').trim();
    if (!id) return;
    const next = { ...(store[id] || {}) };
    for (const c of chats) {
        const chatId = String(c?.id || '');
        const name = String(c?.name || '').trim();
        if (!chatId || !name) continue;
        next[getChatKey(chatId)] = name;
    }
    store = { ...store, [id]: next };
};

export const getBranchChatName = (branchId: string, chatId: string) => {
    const id = String(branchId || '').trim();
    if (!id) return null;
    const key = getChatKey(String(chatId || ''));
    if (!key) return null;
    return store[id]?.[key] || null;
};

