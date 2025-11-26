// src/api/users.js
import apiClient from './client';

export const usersAPI = {
  getAll: async () => {
    const response = await apiClient.get('/auth/users/');
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/auth/users/', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.patch(`/auth/users/${id}/`, data);
    return response.data;
  },

  updateSettings: async (id, data) => {
    const response = await apiClient.patch(`/auth/users/${id}/update_settings/`, data);
    return response.data;
  },

  updateProfilePicture: async (id, formData) => {
    const response = await apiClient.patch(`/auth/users/${id}/profile_picture/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  changePassword: async (id, data) => {
    const response = await apiClient.post(`/auth/users/${id}/change_password/`, data);
    return response.data;
  },

  delete: async (id) => {
    await apiClient.delete(`/auth/users/${id}/`);
  },
};