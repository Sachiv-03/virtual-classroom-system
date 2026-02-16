import api from '@/lib/api';

export const createAnnouncement = async (content: string) => {
    const response = await api.post('/announcements', { content });
    return response.data;
};

export const getAllAnnouncements = async () => {
    const response = await api.get('/announcements');
    return response.data;
};

export const getLatestAnnouncements = async () => {
    const response = await api.get('/announcements/latest');
    return response.data;
};
