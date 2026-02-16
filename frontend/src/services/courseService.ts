import api from '@/lib/api';

export const getCourses = async () => {
    const response = await api.get('/courses');
    return response.data;
};

export const getCourseById = async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
};

// Mock function for teacher to add a class (for now, simpler than full schedule management)
// Add a schedule slot to a course
export const addClassSchedule = async (courseId: string, data: any) => {
    const response = await api.post(`/courses/${courseId}/schedule`, data);
    return response.data;
};
