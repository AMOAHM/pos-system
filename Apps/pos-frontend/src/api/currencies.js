// src/api/currencies.js
import apiClient from './client/';

export const currenciesAPI = {
  getAll: async () => {
    const response = await apiClient.get('currencies');
    return response.data;
  },

  getDefault: async () => {
    // Fixed: Added /api/ prefix to match the first endpoint
    const response = await apiClient.get('currencies/default/');
    return response.data;
  },

  convert: async (amount, fromCurrency, toCurrency) => {
    // Fixed: Added /api/ prefix
    const response = await apiClient.post('currencies/convert/', {
      amount,
      from_currency: fromCurrency,
      to_currency: toCurrency
    });
    return response.data;
  },

  updateRates: async () => {
    // Fixed: Added /api/ prefix
    const response = await apiClient.post('currencies/update-rates/');
    return response.data;
  },
};