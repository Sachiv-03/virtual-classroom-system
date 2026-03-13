import api from '@/lib/api';

export const getTeacherDashboardStats = async () => {
    const response = await api.get('/dashboard/teacher');
    return response.data;
};

export const getStudentDashboardStats = async () => {
    const response = await api.get('/dashboard/student');
    return response.data;
};

export const getLeaderboard = async () => {
    const response = await api.get('/dashboard/leaderboard');
    return response.data;
};
