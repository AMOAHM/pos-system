// src/hooks/useAnalytics.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { analyticsAPI } from '../api/analytics';

/**
 * Custom hook for analytics data
 */
export const useAnalytics = (timeRange = 30) => {
  const { selectedShop } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (selectedShop) {
      loadAnalytics();
    }
  }, [selectedShop, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [dashboard, trends] = await Promise.all([
        analyticsAPI.getDashboard({ shop: selectedShop.id }),
        analyticsAPI.getTrends({ shop: selectedShop.id, days: timeRange })
      ]);

      setData({ dashboard, trends });
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const predictDemand = async (productId, daysAhead = 7) => {
    try {
      return await analyticsAPI.predictDemand(productId, daysAhead);
    } catch (err) {
      console.error('Failed to predict demand:', err);
      throw err;
    }
  };

  return {
    data,
    loading,
    error,
    refresh: loadAnalytics,
    predictDemand
  };
};
