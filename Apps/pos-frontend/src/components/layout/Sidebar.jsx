// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getImageUrl, generateAvatarUrl } from '../../utils/imageHelper';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  BarChart3,
  X,
  ChevronRight,
  LogOut,
  Infinity
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isManager, logout } = useAuth();

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/shops', icon: Store, label: 'Marketplace' },
    { to: '/admin/subscriptions', icon: Infinity, label: 'Plan & Billing' },
    { to: '/admin/products', icon: Package, label: 'Product Lab' },
    { to: '/admin/inventory', icon: BarChart3, label: 'Stock Vault' },
    { to: '/admin/users', icon: Users, label: 'Team access' },
    { to: '/admin/reports', icon: FileText, label: 'Intelligence' },
    { to: '/admin/settings', icon: Settings, label: 'Preferences' },
  ];

  const managerLinks = [
    { to: '/manager/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/manager/sales', icon: ShoppingCart, label: 'POS Terminal' },
    { to: '/manager/products', icon: Package, label: 'Products' },
    { to: '/manager/inventory', icon: BarChart3, label: 'Inventory' },
    { to: '/manager/settings', icon: Settings, label: 'Settings' },
  ];

  const cashierLinks = [
    { to: '/cashier/sales', icon: ShoppingCart, label: 'Checkout' },
    { to: '/cashier/settings', icon: Settings, label: 'Settings' },
  ];

  const links = isAdmin ? adminLinks : isManager ? managerLinks : cashierLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60] lg:hidden transition-all duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-[70] h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:translate-x-0 lg:static flex flex-col shadow-2xl lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Superior Branding */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.25rem] bg-white dark:bg-gray-800 flex items-center justify-center shadow-2xl shadow-indigo-500/10 transform rotate-3 hover:rotate-0 transition-transform duration-300 border border-indigo-100 dark:border-indigo-900/50 overflow-hidden">
                <img src="/shop-logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-widest uppercase">
                  ApexPOS
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                    {user?.role || 'Guest'} Enterprise
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Core */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-2 scrollbar-hide">
          <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
            Main Management
          </p>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `group flex items-center justify-between px-5 py-4 rounded-[1.5rem] transition-all duration-300 ${isActive
                  ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 translate-x-1'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/20' : 'bg-transparent group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20'
                      }`}>
                      <link.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                    </div>
                    <span className="font-bold text-sm tracking-tight">{link.label}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 transition-all duration-300 ${isActive
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0'
                      }`}
                  />
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* User context footer */}
        <div className="p-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] p-5 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img
                  src={getImageUrl(user?.profile_picture) || generateAvatarUrl(user?.username || 'User')}
                  alt={user?.username}
                  className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white dark:ring-gray-800"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                  {user?.username}
                </p>
                <p className="text-[10px] font-bold text-gray-400 truncate uppercase tracking-tighter">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-gray-800 text-red-500 font-bold text-xs border border-red-50 dark:border-red-900/20 hover:bg-red-500 hover:text-white transition-all shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              TERMINATE SESSION
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
