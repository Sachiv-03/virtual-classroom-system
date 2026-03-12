import api from "@/lib/api";

export interface Status {
    _id: string;
    userId: {
        _id: string;
        name: string;
        role: string;
    };
    contentUrl?: string;
    contentType: 'image' | 'video' | 'text';
    text?: string;
    viewedBy: string[];
    createdAt: string;
}

export const getStatuses = async (): Promise<Status[]> => {
    const res = await api.get('/status');
    return res.data;
};

export const createStatus = async (formData: FormData): Promise<Status> => {
    const res = await api.post('/status', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return res.data;
};

export const viewStatus = async (id: string): Promise<void> => {
    await api.post(`/status/${id}/view`);
};

export const deleteStatus = async (id: string): Promise<void> => {
    await api.delete(`/status/${id}`);
};
