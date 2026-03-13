import api from '@/lib/api';

/**
 * Mark attendance with automatic retry on 429 (rate limit) after 13 seconds.
 */
export const markAttendance = async (courseId: string, retryCount = 0): Promise<any> => {
    try {
        const response = await api.post('/attendance/mark', { courseId });
        return response.data;
    } catch (error: any) {
        if (error?.response?.status === 429 && retryCount < 2) {
            // Wait 13 seconds before retrying (model capacity / rate limit)
            await new Promise(resolve => setTimeout(resolve, 13000));
            return markAttendance(courseId, retryCount + 1);
        }
        throw error;
    }
};

export const leaveAttendance = async (courseId: string) => {
    const response = await api.put('/attendance/leave', { courseId });
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
