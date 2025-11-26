// src/hooks/useProducts.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { productsAPI } from '../api/products';

/**
 * Custom hook for product operations
 */
export const useProducts = (filters = {}) => {
  const { selectedShop } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null
  });

  useEffect(() => {
    if (selectedShop) {
      loadProducts();
    }
  }, [selectedShop, JSON.stringify(filters)]);

  const loadProducts = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        shop: selectedShop?.id,
        page,
        ...filters
      };

      const response = await productsAPI.getAll(params);
      
      if (response.results) {
        setProducts(response.results);
        setPagination({
          count: response.count,
          next: response.next,
          previous: response.previous
        });
      } else {
        setProducts(response);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (searchTerm) => {
    await loadProducts(1, { ...filters, search: searchTerm });
  };

  const addProduct = async (productData) => {
    try {
      const newProduct = await productsAPI.create({
        ...productData,
        shop: selectedShop.id
      });
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      console.error('Failed to add product:', err);
      throw err;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const updatedProduct = await productsAPI.update(id, productData);
      setProducts(prev => 
        prev.map(p => p.id === id ? updatedProduct : p)
      );
      return updatedProduct;
    } catch (err) {
      console.error('Failed to update product:', err);
      throw err;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productsAPI.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Failed to delete product:', err);
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    pagination,
    refresh: loadProducts,
    searchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
};

