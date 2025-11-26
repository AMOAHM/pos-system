import React, { useState, useEffect } from 'react';
import { productsAPI } from '../../api';

export default function AdminInventory() {
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });

  // Initialize shop selection based on user role
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'admin') {
      setSelectedShop({ id: null }); // Admin sees all products
    } else {
      const shopId = localStorage.getItem('selected_shop_id');
      if (shopId) {
        setSelectedShop({ id: parseInt(shopId) });
      } else {
        setSelectedShop({ id: null });
        setLoading(false);
      }
    }
  }, []);

  // Load products when shop or filter changes
  useEffect(() => {
    if (selectedShop !== null) {
      loadProducts();
    }
  }, [selectedShop, filter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = {};

      // Only add shop param for non-admin users with a shop selected
      if (selectedShop?.id) {
        params.shop = selectedShop.id;
      }

      if (filter === 'low_stock') {
        params.low_stock = 'true';
      }

      const response = await productsAPI.getAll(params);
      let productsData = Array.isArray(response) ? response : response.results || [];

      if (filter === 'out_of_stock') {
        productsData = productsData.filter(p => p.current_stock === 0);
      }

      setProducts(productsData);
      calculateStats(productsData);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productsData) => {
    const newStats = productsData.reduce((acc, product) => {
      acc.total++;
      if (product.current_stock === 0) {
        acc.outOfStock++;
      } else if (product.current_stock <= product.reorder_level) {
        acc.lowStock++;
      }
      acc.totalValue += product.current_stock * parseFloat(product.unit_price || 0);
      return acc;
    }, { total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 });

    setStats(newStats);
  };

  const getStockStatus = (product) => {
    if (product.current_stock === 0) {
      return { label: 'Out of Stock', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
    } else if (product.current_stock <= product.reorder_level) {
      return { label: 'Low Stock', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    }
    return { label: 'In Stock', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Inventory Management
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Monitor and manage your stock levels
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.lowStock}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.outOfStock}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            GH₵{stats.totalValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
          >
            All Products ({stats.total})
          </button>
          <button
            onClick={() => setFilter('low_stock')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'low_stock'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
          >
            Low Stock ({stats.lowStock})
          </button>
          <button
            onClick={() => setFilter('out_of_stock')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'out_of_stock'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
          >
            Out of Stock ({stats.outOfStock})
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Reorder</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => {
                const status = getStockStatus(product);
                return (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{product.sku}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{product.current_stock}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{product.reorder_level}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      GH₵{(product.current_stock * parseFloat(product.unit_price || 0)).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {products.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filter !== 'all' ? `No products match the "${filter.replace('_', ' ')}" filter.` : 'No products available.'}
          </p>
        </div>
      )}
    </div>
  );
}