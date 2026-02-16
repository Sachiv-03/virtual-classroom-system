import api from '@/lib/api';

export const markAttendance = async (courseId: string) => {
    const response = await api.post('/attendance/mark', { courseId });
    return response.data;
};

export const getAllUserAttendance = async () => {
    const response = await api.get('/attendance/all');
    return response.data;
};

export const getAttendanceAnalytics = async (courseId: string) => {
    const response = await api.get(`/attendance/analytics/${courseId}`);
    return response.data;
};

export const downloadAttendanceReport = async (courseId: string) => {
    try {
        const response = await api.get(`/attendance/report/${courseId}`, {
            responseType: 'blob'
        });

        // Extract filename
        const contentDisposition = response.headers['content-disposition'];
        let filename = 'attendance_report.pdf';
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
        console.error('Report download failed:', error);
        throw error;
    }
};
