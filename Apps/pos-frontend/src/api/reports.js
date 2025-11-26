// src/api/reports.js
import apiClient from './client';

export const reportsAPI = {
  getSalesReport: async (params = {}) => {
    const response = await apiClient.get('/reports/sales/', { params });
    return response.data;
  },

  getInventoryReport: async (params = {}) => {
    const response = await apiClient.get('/reports/inventory/', { params });
    return response.data;
  },

  exportSalesCSV: async (params = {}) => {
    const response = await apiClient.get('/reports/export/sales/', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

