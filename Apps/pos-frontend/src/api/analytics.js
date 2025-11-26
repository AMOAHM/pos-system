// src/api/analytics.js
import apiClient from './client';

export const analyticsAPI = {
  getDashboard: async (params = {}) => {
    const response = await apiClient.get('/analytics/dashboard/', { params });
    return response.data;
  },

  getTrends: async (params = {}) => {
    const response = await apiClient.get('/analytics/trends/', { params });
    return response.data;
  },

  predictDemand: async (productId, daysAhead = 7) => {
    const response = await apiClient.get('/analytics/predict-demand/', {
      params: { product_id: productId, days_ahead: daysAhead }
    });
    return response.data;
  },

  getTopProducts: async (params = {}) => {
    const response = await apiClient.get('/analytics/top-products/', { params });
    return response.data;
  },

  getCustomerInsights: async (params = {}) => {
    const response = await apiClient.get('/analytics/customer-insights/', { params });
    return response.data;
  },
};