// src/components/layout/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { salesAPI } from '../../api/sales';
import { Menu, Sun, Moon, Store, Bell, Search, Globe, ShoppingBag, Clock, ChevronRight } from 'lucide-react';

// Simple time ago helper to avoid external dependencies
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

export default function Navbar({ onToggleSidebar }) {
  const { user, selectedShop, allowedShops, switchShop } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchRecentSales = async () => {
    if (showNotifications) {
      setShowNotifications(false);
      return;
    }

    setLoading(true);
    setShowNotifications(true);
    try {
      const params = { limit: 5, ordering: '-created_at' };
      if (selectedShop?.id) params.shop = selectedShop.id;

      const response = await salesAPI.getAll(params);
      setRecentSales(Array.isArray(response) ? response : response.results || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
      <div className="h-full px-6 sm:px-8">
        <div className="flex justify-between items-center h-full">
          {/* Left Section: Context & Navigation */}
          <div className="flex items-center gap-6">
            <button
              onClick={onToggleSidebar}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 lg:hidden"
            >
              <Menu className="w-5 h-5 font-black" />
            </button>

            <div className="hidden md:flex items-center gap-2 px-1.5 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tighter">Live Network</span>
              </div>
              <div className="px-4 py-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">v2.0.4-stable</span>
              </div>
            </div>
          </div>

          {/* Center Section: Global Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Intelligence Search... (⌘K)"
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          {/* Right Section: Actions & Settings */}
          <div className="flex items-center gap-3">
            {/* Shop Selector */}
            {allowedShops.length > 0 && (
              <div className="relative group">
                <div className="flex items-center gap-3 pl-4 pr-2 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 hover:border-indigo-300 transition-all cursor-pointer">
                  <img src="/shop-logo.png" alt="Shop" className="w-4 h-4 object-contain" />
                  <select
                    value={selectedShop?.id || ''}
                    onChange={(e) => {
                      const shop = allowedShops.find(
                        (s) => s.id === parseInt(e.target.value)
                      );
                      switchShop(shop);
                    }}
                    className="appearance-none bg-transparent border-none focus:ring-0 text-xs font-black text-indigo-900 dark:text-indigo-300 pr-8 cursor-pointer uppercase tracking-tight"
                  >
                    {allowedShops.map((shop) => (
                      <option key={shop.id} value={shop.id} className="dark:bg-gray-800">
                        {shop.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Menu className="w-3 h-3 text-indigo-400 rotate-90" />
                  </div>
                </div>
              </div>
            )}

            <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 mx-1"></div>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={fetchRecentSales}
                className={`relative p-3 rounded-2xl transition-all active:scale-95 ${showNotifications ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full ring-4 ring-white dark:ring-gray-900"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-96 bg-white dark:bg-gray-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                    <h3 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-white">Recent Activity</h3>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-[10px] font-black text-indigo-600 dark:text-indigo-400 rounded-md">SALES</span>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                    {loading ? (
                      <div className="p-12 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Synchronizing...</p>
                      </div>
                    ) : recentSales.length > 0 ? (
                      recentSales.map((sale) => (
                        <div key={sale.id} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0 group cursor-pointer">
                          <div className="flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">New Sale: #{sale.id}</p>
                                <p className="text-sm font-black text-green-600 dark:text-green-400 whitespace-nowrap ml-2">₵{parseFloat(sale.total_amount).toFixed(2)}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                  {getTimeAgo(sale.created_at)}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <ShoppingBag className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase">No recent activity found</p>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 text-center border-t border-gray-50 dark:border-gray-800">
                    <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">View All Intelligence</button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 transition-all active:scale-95"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
