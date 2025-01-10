export const loadFromStorage = (key, defaultValue) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
};

export const saveToStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const exportMessages = (messages, pageName) => {
    const exportData = {
        pageName: pageName,
        exportDate: new Date().toISOString(),
        messages: messages.map(msg => ({
            timestamp: new Date().toISOString(),
            role: msg.role,
            content: msg.content,
            model: msg.model || null,
            groupId: msg.groupId
        }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-${pageName}-${new Date().toLocaleDateString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}; 