// src/api/auth.js
import apiClient from './client';

export const authAPI = {
  // -------------------------------------------------
  // Login – matches backend route /login/
  // -------------------------------------------------
  login: async (username, password, role, shopId = null) => {
    try {
      const response = await apiClient.post('/auth/login/', {
        username,
        password,
        role,
        shop_id: shopId,
      });

      // Store JWT tokens
      if (response.data.access) {
        localStorage.setItem('accessToken', response.data.access);
      }
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
      }

      // Store user info
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error('Login failed:', error.response?.data);
      throw error;
    }
  },

  // -------------------------------------------------
  // Refresh JWT token
  // -------------------------------------------------
  refreshToken: async (refreshToken) => {
    try {
      const response = await apiClient.post('/auth/token/refresh/', {
        refresh: refreshToken,
      });

      if (response.data.access) {
        localStorage.setItem('accessToken', response.data.access);
      }
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
      }

      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      throw error;
    }
  },

  // -------------------------------------------------
  // Logout – blacklist refresh token
  // -------------------------------------------------
  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/token/blacklist/', {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // -------------------------------------------------
  // Get current user info
  // -------------------------------------------------
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/users/');
      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw error;
    }
  },

  // -------------------------------------------------
  // Password Reset
  // -------------------------------------------------
  forgotPassword: async (email) => {
    try {
      const response = await apiClient.post('/auth/forgot-password/', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await apiClient.post('/auth/reset-password/', {
        token,
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  },

  // -------------------------------------------------
  // Helper utilities
  // -------------------------------------------------
  isAuthenticated: () => !!localStorage.getItem('accessToken'),

  getUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined') {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      return null;
    }
  },
};