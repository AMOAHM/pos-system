import React, { useState, useEffect } from 'react';
import { productsAPI } from '../../api';
import { Package, AlertTriangle, XCircle, DollarSign, TrendingUp, Inbox } from 'lucide-react';

function InventoryStatCard({ title, value, subValue, icon: Icon, color, textColor }) {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-sm dark:shadow-lg p-3 sm:p-4 lg:p-5 border border-gray-100 dark:border-slate-700 hover:shadow-md dark:hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate whitespace-nowrap">{title}</p>
          <p className={`text-sm sm:text-base lg:text-lg font-black truncate whitespace-nowrap ${textColor || 'text-gray-900 dark:text-white'}`}>{value}</p>
          {subValue && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate whitespace-nowrap">
              <TrendingUp className="w-3 h-3 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span className="truncate">{subValue}</span>
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg flex-shrink-0 ${color} bg-opacity-10 dark:bg-opacity-20 shadow-md`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${textColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function AdminInventory() {
  const [selectedShop, setSelectedShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    totalSku: 0,
    totalItems: 0,
    lowStock: 0,
    lowStockValue: 0,
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
      const stock = parseInt(product.current_stock || 0);
      const price = parseFloat(product.unit_price || 0);
      const value = stock * price;

      acc.totalSku++;
      acc.totalItems += stock;
      acc.totalValue += value;

      if (stock === 0) {
        acc.outOfStock++;
      } else if (stock <= product.reorder_level) {
        acc.lowStock++;
        acc.lowStockValue += value;
      }
      return acc;
    }, {
      totalSku: 0,
      totalItems: 0,
      lowStock: 0,
      lowStockValue: 0,
      outOfStock: 0,
      totalValue: 0
    });

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Inventory Central
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Real-time tracking and financial overview of your stock
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 mb-10">
        <InventoryStatCard
          title="Total Stock Value"
          value={`₵${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue={`${stats.totalItems.toLocaleString()} units available`}
          icon={DollarSign}
          color="bg-green-500"
          textColor="text-green-600 dark:text-green-400"
        />

        <InventoryStatCard
          title="Total Products (SKUs)"
          value={stats.totalSku}
          subValue="Across all categories"
          icon={Package}
          color="bg-blue-500"
          textColor="text-blue-600 dark:text-blue-400"
        />

        <InventoryStatCard
          title="Low Stock Warning"
          value={stats.lowStock}
          subValue={`Value: ₵${stats.lowStockValue.toLocaleString()}`}
          icon={AlertTriangle}
          color="bg-orange-500"
          textColor="text-orange-600 dark:text-orange-400"
        />

        <InventoryStatCard
          title="Out of Stock"
          value={stats.outOfStock}
          subValue="Immediate restock needed"
          icon={XCircle}
          color="bg-red-500"
          textColor="text-red-600 dark:text-red-400"
        />
      </div>

      {/* Filter Buttons & Search Area */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
            >
              All Products
            </button>
            <button
              onClick={() => setFilter('low_stock')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === 'low_stock'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 dark:shadow-orange-900/20'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
            >
              Low Stock Alerts
            </button>
            <button
              onClick={() => setFilter('out_of_stock')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === 'out_of_stock'
                ? 'bg-red-600 text-white shadow-lg shadow-red-200 dark:shadow-red-900/20'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-700/50">
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Product Details</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">SKU Identifier</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest text-center">Current Stock</th>
                <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Health Status</th>
                <th className="px-8 py-5 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Inventory Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {products.map((product) => {
                const status = getStockStatus(product);
                return (
                  <tr key={product.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="px-8 py-6">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{product.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{product.category_name || 'Uncategorized'}</div>
                    </td>
                    <td className="px-8 py-6 text-sm font-medium text-gray-500 dark:text-gray-400">{product.sku}</td>
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-gray-900 dark:text-white text-center">{product.current_stock}</div>
                      <div className="text-[10px] text-gray-400 text-center uppercase tracking-tighter">Min: {product.reorder_level}</div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex px-3 py-1.5 text-[10px] font-black uppercase rounded-lg ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-sm font-black text-gray-900 dark:text-white">
                        ₵{(product.current_stock * parseFloat(product.unit_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">@ ₵{parseFloat(product.unit_price || 0).toFixed(2)} / unit</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {products.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-20 text-center mt-10 border-2 border-dashed border-gray-100 dark:border-slate-700">
          <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Clean as a whistle!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
            {filter !== 'all' ? `No products currently match the ${filter.replace('_', ' ')} alert category.` : "You haven't added any products to your inventory yet."}
          </p>
        </div>
      )}
    </div>
  );
}
