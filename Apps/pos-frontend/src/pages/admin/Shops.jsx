// src/pages/admin/Shops.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopsAPI } from '../../api';
import { Plus, Edit2, Trash2, MapPin, Phone, Mail, AlertCircle } from 'lucide-react';

export default function AdminShops() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [shopLimitError, setShopLimitError] = useState(null);
  const [maxShops, setMaxShops] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    timezone: 'Africa/Accra',
  });

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const data = await shopsAPI.getAll();
      setShops(data.results || data);
    } catch (error) {
      console.error('Failed to load shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShopLimitError(null);

    try {
      if (editingShop) {
        await shopsAPI.update(editingShop.id, formData);
      } else {
        await shopsAPI.create(formData);
      }

      setShowModal(false);
      setEditingShop(null);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        timezone: 'Africa/Accra',
      });
      loadShops();
    } catch (error) {
      console.error('Failed to save shop:', error);
      
      // Check if error is due to shop limit exceeded
      if (error.response?.status === 403 && error.response?.data?.detail?.includes('subscription')) {
        const errorMsg = error.response.data.detail;
        // Extract max shops from error message
        const match = errorMsg.match(/(\d+)\s+shop\(s\)/);
        if (match) {
          setMaxShops(parseInt(match[1]));
        }
        setShopLimitError(errorMsg);
        setShowModal(false);
      } else {
        alert('Failed to save shop. Please try again.');
      }
    }
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData({
      name: shop.name,
      address: shop.address,
      phone: shop.phone,
      email: shop.email || '',
      timezone: shop.timezone,
    });
    setShowModal(true);
  };

  const handleDelete = async (shopId) => {
    if (!confirm('Are you sure you want to delete this shop?')) return;

    try {
      await shopsAPI.delete(shopId);
      loadShops();
    } catch (error) {
      console.error('Failed to delete shop:', error);
      alert('Failed to delete shop. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shop Limit Error Alert */}
      {shopLimitError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
              Shop Limit Exceeded
            </h3>
            <p className="text-sm text-red-800 dark:text-red-300 mb-3">
              {shopLimitError}
            </p>
            <button
              onClick={() => navigate('/admin/subscriptions')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Upgrade Plan
            </button>
          </div>
          <button
            onClick={() => setShopLimitError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Shops Management
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <Plus className="w-5 h-5" />
          Add Shop
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.map((shop) => (
          <div
            key={shop.id}
            className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-lg border border-gray-100 dark:border-slate-700 p-6 hover:shadow-lg dark:hover:shadow-xl transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {shop.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(shop)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(shop.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <span className="text-gray-600 dark:text-gray-400">
                  {shop.address}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {shop.phone}
                </span>
              </div>
              {shop.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    {shop.email}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Users</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {shop.users_count || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Products</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {shop.products_count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl dark:shadow-2xl border border-gray-100 dark:border-slate-700 p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {editingShop ? 'Edit Shop' : 'Add New Shop'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Address *
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingShop(null);
                    setFormData({
                      name: '',
                      address: '',
                      phone: '',
                      email: '',
                      timezone: 'Africa/Accra',
                    });
                  }}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {editingShop ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
