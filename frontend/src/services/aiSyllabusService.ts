import api from '@/lib/api';

export const createAISyllabus = async (data: any) => {
    const response = await api.post('/syllabus/create', data);
    return response.data;
};

export const generateResources = async (id: string) => {
    const response = await api.post(`/syllabus/generate-resources/${id}`);
    return response.data;
};

export const approveSyllabus = async (id: string) => {
    const response = await api.put(`/syllabus/approve/${id}`);
    return response.data;
};

export const updateAISyllabus = async (id: string, data: any) => {
    const response = await api.put(`/syllabus/update/${id}`, data);
    return response.data;
};

export const deleteAISyllabus = async (id: string) => {
    const response = await api.delete(`/syllabus/delete/${id}`);
    return response.data;
};

export const getAllSyllabuses = async () => {
    const response = await api.get('/syllabus');
    return response.data;
};

export const getSyllabusById = async (id: string) => {
    const response = await api.get(`/syllabus/${id}`);
    return response.data;
};
