// src/api/suppliers.js
import apiClient from './client';

export const suppliersAPI = {
  getAll: async () => {
    const response = await apiClient.get('/suppliers/');
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/suppliers/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/suppliers/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    await apiClient.delete(`/suppliers/${id}/`);
  },
};
