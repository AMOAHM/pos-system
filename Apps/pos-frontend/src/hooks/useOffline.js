// src/hooks/useOffline.js
import { useOffline as useOfflineContext } from '../contexts/OfflineContext';
import { useState, useEffect } from 'react';

export const useOfflineProducts = (shopId) => {
  const { isOnline, getCachedProducts, cacheProducts } = useOfflineContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [shopId, isOnline]);

  const loadProducts = async () => {
    setLoading(true);

    if (isOnline) {
      try {
        // Fetch from API
        const { productsAPI } = await import('../api/products');
        const data = await productsAPI.getAll({ shop: shopId });
        
        setProducts(data.results || data);
        
        // Cache for offline use
        await cacheProducts(data.results || data);
      } catch (error) {
        console.error('Failed to load products:', error);
        
        // Fallback to cache
        const cached = await getCachedProducts(shopId);
        setProducts(cached);
      }
    } else {
      // Load from cache
      const cached = await getCachedProducts(shopId);
      setProducts(cached);
    }

    setLoading(false);
  };

  return { products, loading, refresh: loadProducts };
};

