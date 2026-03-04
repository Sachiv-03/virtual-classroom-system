import api from '../lib/api';

export const getConversations = async () => {
    const response = await api.get('/messages/conversations');
    return response.data.data;
};

export const getMessages = async (userId: string) => {
    const response = await api.get(`/messages/${userId}`);
    return response.data.data;
};

export const sendMessage = async (receiverId: string, content: string) => {
    const response = await api.post('/messages', { receiverId, content });
    return response.data.data;
};

export const searchUsers = async (query: string) => {
    const response = await api.get(`/messages/users/search?q=${query}`);
    return response.data.data;
};
