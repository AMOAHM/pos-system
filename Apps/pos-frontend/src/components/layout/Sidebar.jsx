// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
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
  ChevronLeft,
  LogOut,
  Infinity,
  Menu
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isManager, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

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
        className={`fixed top-0 left-0 z-[70] h-full bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transform transition-all duration-300 lg:static flex flex-col shadow-lg lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isCollapsed ? 'w-24 lg:w-24' : 'w-80 lg:w-64'}`}
      >
        {/* Header with Logo */}
        <div className={`p-6 pb-4 border-b border-gray-100 dark:border-slate-800 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">ApexPOS</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Control</p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 scrollbar-hide">
          {!isCollapsed && (
            <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Navigation
            </p>
          )}
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'
                }`
              }
              title={isCollapsed ? link.label : ''}
            >
              {({ isActive }) => (
                <>
                  <link.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium text-sm">{link.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer with User Info */}
        <div className={`p-4 border-t border-gray-100 dark:border-slate-800 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={getImageUrl(user?.profile_picture) || generateAvatarUrl(user?.username || 'User')}
                  alt={user?.username}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
                    {user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div
              className="relative group cursor-pointer"
              onClick={logout}
              title="Logout"
            >
              <img
                src={getImageUrl(user?.profile_picture) || generateAvatarUrl(user?.username || 'User')}
                alt={user?.username}
                className="w-10 h-10 rounded-lg object-cover hover:ring-2 hover:ring-red-500 transition-all"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
