import api from '../lib/api';

export const getChatUsers = async () => {
    const response = await api.get('/messages/users');
    return response.data;
};

export const getConversation = async (userId: string) => {
    const response = await api.get(`/messages/${userId}`);
    return response.data;
};

export const sendMessage = async (receiverId: string, messageText: string) => {
    const response = await api.post('/messages/send', { receiverId, messageText });
    return response.data;
};
