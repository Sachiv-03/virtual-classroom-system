import api from '../lib/api';

export const getChatUsers = async () => {
    const response = await api.get('/messages/users');
    return response.data;
};

export const getConversation = async (userId: string) => {
    const response = await api.get(`/messages/${userId}`);
    return response.data;
};

export const sendMessage = async (
    receiverId: string,
    messageText: string,
    file?: File | null,
    fileType?: string,
    replyTo?: string | null,
    isForwarded?: boolean,
    groupId?: string,
    isEncrypted?: boolean
) => {
    if (file) {
        const formData = new FormData();
        if (receiverId) formData.append('receiverId', receiverId);
        if (groupId) formData.append('groupId', groupId);
        if (messageText) formData.append('messageText', messageText);
        if (fileType) formData.append('fileType', fileType);
        if (replyTo) formData.append('replyTo', replyTo);
        if (isForwarded) formData.append('isForwarded', String(isForwarded));
        if (isEncrypted) formData.append('isEncrypted', String(isEncrypted));
        formData.append('file', file);

        const response = await api.post('/messages/send', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    } else {
        const response = await api.post('/messages/send', {
            receiverId: receiverId || undefined,
            groupId,
            messageText,
            replyTo,
            isForwarded,
            isEncrypted
        });
        return response.data;
    }
};

export const editMessage = async (messageId: string, messageText: string) => {
    const response = await api.put(`/messages/${messageId}`, { messageText });
    return response.data;
};

export const deleteMessage = async (messageId: string, type: 'me' | 'everyone') => {
    const response = await api.delete(`/messages/${messageId}`, { data: { type } });
    return response.data;
};

export const reactToMessage = async (messageId: string, emoji: string) => {
    const response = await api.post(`/messages/${messageId}/react`, { emoji });
    return response.data;
};

export const toggleStarMessage = async (messageId: string) => {
    const response = await api.post(`/messages/${messageId}/star`);
    return response.data;
};

export const togglePinUser = async (userId: string) => {
    const response = await api.post(`/messages/pin/${userId}`);
    return response.data;
};
