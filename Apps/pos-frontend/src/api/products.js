// src/api/products.js
import apiClient from './client';

export const productsAPI = {
  getAll: async (params = {}) => {
    const response = await apiClient.get('/products/', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/products/${id}/`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/products/', data);
    return response.data;
  },

  addWithStock: async (data) => {
    const response = await apiClient.post('/products/add_with_stock/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/products/${id}/`, data);
    return response.data;
  },

  delete: async (id) => {
    await apiClient.delete(`/products/${id}/`);
  },
};
