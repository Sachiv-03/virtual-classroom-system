import api from '../lib/api';

export const paymentService = {
    createOrder: async (courseId: string) => {
        const response = await api.post('/payment/create-order', { courseId });
        return response.data;
    },

    verifyPayment: async (paymentData: any) => {
        const response = await api.post('/payment/verify-payment', paymentData);
        return response.data;
    },

    enrollFree: async (courseId: string) => {
        const response = await api.post('/payment/enroll-free', { courseId });
        return response.data;
    }
};
