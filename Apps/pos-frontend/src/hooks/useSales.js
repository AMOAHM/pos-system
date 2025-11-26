// src/hooks/useSales.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { salesAPI } from '../api/sales';

/**
 * Custom hook for sales operations
 */
export const useSales = (filters = {}) => {
  const { selectedShop } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedShop) {
      loadSales();
    }
  }, [selectedShop, JSON.stringify(filters)]);

  const loadSales = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        shop: selectedShop?.id,
        ...filters
      };

      const response = await salesAPI.getAll(params);
      setSales(response.results || response);
    } catch (err) {
      console.error('Failed to load sales:', err);
      setError(err.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const createSale = async (saleData) => {
    try {
      const newSale = await salesAPI.create({
        ...saleData,
        shop_id: selectedShop.id
      });
      setSales(prev => [newSale, ...prev]);
      return newSale;
    } catch (err) {
      console.error('Failed to create sale:', err);
      throw err;
    }
  };

  return {
    sales,
    loading,
    error,
    refresh: loadSales,
    createSale
  };
};

