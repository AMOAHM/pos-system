// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { shopsAPI, reportsAPI } from '../../api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Store,
  Activity,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';

// ------------------------------------------------------------------
// Helper UI components
// ------------------------------------------------------------------
function StatCard({ title, value, icon: Icon, trend, trendValue, color }) {
  const isPositive = trend === 'up';
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
          {trendValue && (
            <div className="flex items-center gap-1">
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 text-green-500" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-500" />
              )}
              <span className={`text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, action, onAction }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {action && (
          <button onClick={onAction} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
            {action}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// ------------------------------------------------------------------
// Main Dashboard component
// ------------------------------------------------------------------
export default function ModernAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [shops, setShops] = useState([]);
  const [salesReport, setSalesReport] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [salesData, setSalesData] = useState([]);

  // Load data whenever the selected time range changes
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Dynamically import the API modules (they already include auth headers)
      const { shopsAPI, reportsAPI } = await import('../../api');

      const [shopsData, salesData, inventoryData] = await Promise.all([
        shopsAPI.getAll(),
        reportsAPI.getSalesReport({ period: timeRange }),
        reportsAPI.getInventoryReport(),
      ]);

      setShops(shopsData.results || shopsData);
      setSalesReport(salesData);
      setInventoryReport(inventoryData);

      // ---- Revenue chart (last 30 days) ----
      if (salesData?.daily_sales) {
        const processed = salesData.daily_sales.slice(-12).map(item => ({
          month: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: parseFloat(item.total_revenue || 0),
          profit: parseFloat(item.total_revenue || 0) * 0.3,
        }));
        setRevenueData(processed);
      }

      // ---- Category breakdown (top products) ----
      if (salesData?.category_breakdown) {
        const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
        const processed = salesData.category_breakdown.map((cat, i) => ({
          name: cat.category_name || cat.name,
          value: parseFloat(cat.total_revenue || cat.value || 0),
          color: colors[i % colors.length],
        }));
        setCategoryData(processed);
      }

      // ---- Weekly sales bar chart ----
      if (salesData?.weekly_sales) {
        const processed = salesData.weekly_sales.map(item => ({
          day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
          sales: parseInt(item.transaction_count || item.sales || 0),
        }));
        setSalesData(processed);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Stats calculations (derived from API responses)
  // ------------------------------------------------------------------
  const stats = {
    totalRevenue: salesReport?.summary?.total_revenue || 0,
    totalTransactions: salesReport?.summary?.total_transactions || 0,
    totalProducts: inventoryReport?.summary?.total_products || 0,
    lowStockItems: inventoryReport?.summary?.low_stock_items || 0,
    activeUsers: shops.reduce((sum, shop) => sum + (shop.users_count || 0), 0),
    avgOrderValue:
      salesReport?.summary?.total_transactions > 0
        ? salesReport?.summary?.total_revenue / salesReport?.summary?.total_transactions
        : 0,
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Welcome back! Here’s your business overview.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Revenue"
            value={`₵${stats.totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon={DollarSign}
            trend="up"
            trendValue="+12.5%"
            color="bg-green-500"
          />
          <StatCard
            title="Transactions"
            value={stats.totalTransactions.toLocaleString()}
            icon={ShoppingCart}
            trend="up"
            trendValue="+8.2%"
            color="bg-blue-500"
          />
          <StatCard
            title="Products"
            value={stats.totalProducts.toLocaleString()}
            icon={Package}
            trend="up"
            trendValue="+3.1%"
            color="bg-purple-500"
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStockItems}
            icon={AlertTriangle}
            trend="down"
            trendValue="-2 items"
            color="bg-orange-500"
          />
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon={Users}
            trend="up"
            trendValue="+15.3%"
            color="bg-indigo-500"
          />
          <StatCard
            title="Avg Order"
            value={`₵${stats.avgOrderValue.toFixed(2)}`}
            icon={Activity}
            trend="up"
            trendValue="+5.7%"
            color="bg-pink-500"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartCard title="Revenue Overview" action="View Details">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#colorProfit)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <ChartCard title="Sales by Category" action="View All">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  dataKey="value"
                  style={{ fontSize: '11px' }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Weekly Sales Performance" action="View Report">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Shops Overview" action="View All">
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {shops.slice(0, 5).map(shop => (
                <div
                  key={shop.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{shop.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{shop.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{shop.products_count || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Products</p>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}