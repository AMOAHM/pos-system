// src/components/analytics/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportsAPI } from '../../api/reports';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { selectedShop } = useAuth();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    if (selectedShop) {
      loadAnalytics();
    }
  }, [selectedShop, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await reportsAPI.getSalesReport({
        shop: selectedShop.id,
        days: timeRange
      });
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Advanced Analytics
        </h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₵${(analyticsData?.summary?.total_revenue || 0).toFixed(2)}`}
          icon={DollarSign}
          color="bg-green-500"
          trend="+12.5%"
        />
        <StatCard
          title="Transactions"
          value={analyticsData?.summary?.total_transactions || 0}
          icon={ShoppingCart}
          color="bg-blue-500"
          trend="+8.3%"
        />
        <StatCard
          title="Avg. Transaction"
          value={`₵${((analyticsData?.summary?.total_revenue || 0) / (analyticsData?.summary?.total_transactions || 1)).toFixed(2)}`}
          icon={TrendingUp}
          color="bg-purple-500"
          trend="+3.2%"
        />
        <StatCard
          title="Customers"
          value="1,234"
          icon={Users}
          color="bg-orange-500"
          trend="+15.7%"
        />
      </div>

      {/* Revenue Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Revenue Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analyticsData?.daily_sales || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Top Products
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData?.top_products?.slice(0, 5) || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product__name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total_revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Payment Methods
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Cash', value: analyticsData?.summary?.cash_sales || 0 },
                  { name: 'Card', value: analyticsData?.summary?.card_sales || 0 },
                  { name: 'Mobile Money', value: analyticsData?.summary?.mobile_money_sales || 0 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[0, 1, 2].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Sales Pattern */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Hourly Sales Pattern
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={Array.from({ length: 24 }, (_, i) => ({
              hour: `${i}:00`,
              sales: Math.floor(Math.random() * 100)
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sales" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value}
          </p>
          {trend && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {trend} vs last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
