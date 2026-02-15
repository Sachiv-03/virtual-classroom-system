import api from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const getAssignments = async () => {
    const response = await api.get('/assignments');
    return response.data;
};

export const getAssignment = async (id: string) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
};

export const createAssignment = async (data: FormData) => {
    const response = await api.post('/assignments', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const updateAssignment = async (id: string, data: any) => {
    const response = await api.put(`/assignments/${id}`, data);
    return response.data;
};

export const deleteAssignment = async (id: string) => {
    const response = await api.delete(`/assignments/${id}`);
    return response.data;
};

export const submitAssignment = async (data: FormData) => {
    const response = await api.post('/submissions', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const getSubmissionsForAssignment = async (assignmentId: string) => {
    const response = await api.get(`/submissions/assignment/${assignmentId}`);
    return response.data;
};

export const gradeSubmission = async (submissionId: string, data: { marks: number; feedback: string }) => {
    const response = await api.put(`/submissions/${submissionId}/grade`, data);
    return response.data;
};

export const downloadSubmission = async (submissionId: string) => {
    try {
        const response = await api.get(`/submissions/${submissionId}/download`, {
            responseType: 'blob'
        });

        // Extract filename from content-disposition if possible, or use a default
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'submission_file';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/"/g, '');
            }
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
};

export const downloadAssignmentFile = async (assignmentId: string, fileIndex: number) => {
    try {
        const response = await api.get(`/assignments/${assignmentId}/download/${fileIndex}`, {
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'];
        let filename = 'assignment_file';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/"/g, '');
            }
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
};
