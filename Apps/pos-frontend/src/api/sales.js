import apiClient from './client';

export const salesAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/sales/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/sales/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/sales/', data);
    return response.data;
  },

  printReceipt: async (saleId) => {
    const response = await apiClient.get(`/sales/${saleId}/print-receipt/`, {
      responseType: 'blob', // Important for PDF download
    });
    return response.data;
  },
};
