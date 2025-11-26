// src/hooks/useShop.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { shopsAPI } from '../api/shops';

/**
 * Custom hook for shop-related operations
 */
export const useShop = () => {
  const { user, selectedShop } = useAuth();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShops();
  }, [user]);

  const loadShops = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const data = await shopsAPI.getAll();
      setShops(data.results || data);
    } catch (err) {
      console.error('Failed to load shops:', err);
      setError(err.message || 'Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const getShopKPIs = async (shopId) => {
    try {
      const kpis = await shopsAPI.getKPIs(shopId || selectedShop?.id);
      return kpis;
    } catch (err) {
      console.error('Failed to load KPIs:', err);
      throw err;
    }
  };

  return {
    shops,
    selectedShop,
    loading,
    error,
    refresh: loadShops,
    getShopKPIs
  };
};

