import api from '@/lib/api';

export const getCourses = async () => {
    const response = await api.get('/courses');
    return response.data;
};

export const getCourseById = async (id: string) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
};

export const updateCourse = async (courseId: string, data: any) => {
    const response = await api.put(`/courses/${courseId}`, data);
    return response.data;
};

// Mock function for teacher to add a class (for now, simpler than full schedule management)
// Add a schedule slot to a course
export const addClassSchedule = async (courseId: string, data: any) => {
    const response = await api.post(`/courses/${courseId}/schedule`, data);
    return response.data;
};

// Syllabus Builder API Methods
export const addCourseUnit = async (courseId: string, title: string) => {
    const response = await api.post(`/courses/${courseId}/units`, { title });
    return response.data;
};

export const updateCourseUnit = async (courseId: string, unitId: string, title: string) => {
    const response = await api.put(`/courses/${courseId}/units/${unitId}`, { title });
    return response.data;
};

export const deleteCourseUnit = async (courseId: string, unitId: string) => {
    const response = await api.delete(`/courses/${courseId}/units/${unitId}`);
    return response.data;
};

export const addCourseTopic = async (courseId: string, unitId: string, topicData: { title: string, duration?: string, videoUrl?: string, materials?: any[] }) => {
    const response = await api.post(`/courses/${courseId}/units/${unitId}/topics`, topicData);
    return response.data;
};

export const deleteCourseTopic = async (courseId: string, unitId: string, topicId: string) => {
    const response = await api.delete(`/courses/${courseId}/units/${unitId}/topics/${topicId}`);
    return response.data;
};

export const enrollInCourse = async (courseId: string) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
};

export const getEnrolledStudents = async (courseId: string) => {
    const response = await api.get(`/courses/${courseId}/students`);
    return response.data;
};

export const markTopicCompleted = async (courseId: string, topicId: string) => {
    const response = await api.post(`/courses/${courseId}/topics/${topicId}/complete`);
    return response.data;
};
