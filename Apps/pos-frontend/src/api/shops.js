// src/api/shops.js
import apiClient from './client';

export const shopsAPI = {
  getAll: async () => {
    const response = await apiClient.get('/shops/');
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/shops/${id}/`);
    return response.data;
  },

  getKPIs: async (id) => {
    const response = await apiClient.get(`/shops/${id}/kpis/`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/shops/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/shops/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    await apiClient.delete(`/shops/${id}/`);
  },
};
