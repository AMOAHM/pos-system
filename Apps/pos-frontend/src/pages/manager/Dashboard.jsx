import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { shopsAPI, suppliersAPI } from '../../api';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Building2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

function StatCard({ title, value, icon: Icon, color, subtitle }) {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-sm dark:shadow-lg p-3 sm:p-4 lg:p-5 hover:shadow-md dark:hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate whitespace-nowrap">{title}</p>
          <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white truncate whitespace-nowrap">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate whitespace-nowrap">
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-full flex-shrink-0 ${color} shadow-md dark:shadow-lg`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function ChangeIndicator({ current, previous }) {
  if (!previous || previous === 0) return null;
  
  const change = ((current - previous) / previous * 100).toFixed(1);
  const isPositive = change > 0;
  
  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${
      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(change)}% vs yesterday
    </div>
  );
}

export default function ManagerDashboard() {
  const { selectedShop } = useAuth();
  const [kpis, setKpis] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedShop) {
      loadDashboardData();
    }
  }, [selectedShop]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpisData, suppliersData] = await Promise.all([
        shopsAPI.getKPIs(selectedShop.id),
        suppliersAPI.getAll()
      ]);
      
      setKpis(kpisData);
      setSuppliers(suppliersData.results || suppliersData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {selectedShop?.name} Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor your store performance
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Today's Stats */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">
          Today's Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          <StatCard
            title="Today's Revenue"
            value={`₵${(kpis?.today?.revenue || 0).toFixed(2)}`}
            icon={DollarSign}
            color="bg-green-500"
            subtitle={<ChangeIndicator current={kpis?.today?.revenue || 0} previous={kpis?.yesterday?.revenue || 0} />}
          />
          <StatCard
            title="Today's Transactions"
            value={kpis?.today?.transactions || 0}
            icon={ShoppingCart}
            color="bg-blue-500"
            subtitle={<ChangeIndicator current={kpis?.today?.transactions || 0} previous={kpis?.yesterday?.transactions || 0} />}
          />
          <StatCard
            title="Low Stock Items"
            value={kpis?.low_stock_count || 0}
            icon={AlertTriangle}
            color="bg-orange-500"
            subtitle="Needs attention"
          />
          <StatCard
            title="Active Suppliers"
            value={suppliers.length}
            icon={Building2}
            color="bg-purple-500"
            subtitle={`${suppliers.length} registered`}
          />
        </div>
      </div>

      {/* Performance & Suppliers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Comparison */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md dark:shadow-lg border border-gray-100 dark:border-slate-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Performance Comparison
          </h2>
          <div className="space-y-6">
            {/* Revenue Comparison */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Revenue
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Today
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₵{(kpis?.today?.revenue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Yesterday
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₵{(kpis?.yesterday?.revenue || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Last 7 Days
                  </span>
                  <span className="font-bold text-blue-900 dark:text-blue-300">
                    ₵{(kpis?.last_7_days?.revenue || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Transactions Comparison */}
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Transactions
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Today
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {kpis?.today?.transactions || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Yesterday
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {kpis?.yesterday?.transactions || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md dark:shadow-lg border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Suppliers
            </h2>
            <a
              href="/manager/suppliers"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </a>
          </div>
          
          {suppliers.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {suppliers.slice(0, 5).map((supplier) => (
                <div
                  key={supplier.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {supplier.name}
                      </p>
                      {supplier.contact_person && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {supplier.contact_person}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {supplier.phone && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {supplier.phone}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {supplier.products_count || 0} products
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No suppliers yet</p>
              <a
                href="/manager/suppliers"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
              >
                Add your first supplier
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          7-Day Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₵{(kpis?.last_7_days?.revenue || 0).toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Revenue</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {kpis?.last_7_days?.transactions || 0}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ₵{kpis?.last_7_days?.transactions > 0 
                ? ((kpis?.last_7_days?.revenue || 0) / kpis.last_7_days.transactions).toFixed(2)
                : '0.00'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Transaction</p>
          </div>
        </div>
      </div>
    </div>
  );
}
