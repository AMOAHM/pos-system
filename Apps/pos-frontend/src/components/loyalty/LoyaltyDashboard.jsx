// src/components/loyalty/LoyaltyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { loyaltyAPI } from '../../api/loyalty';
import { Gift, Star, TrendingUp, Users } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-sm dark:shadow-lg p-3 sm:p-4 lg:p-5 hover:shadow-md dark:hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate whitespace-nowrap">{title}</p>
          <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white truncate whitespace-nowrap">
            {value}
          </p>
        </div>
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-full flex-shrink-0 ${color} shadow-md dark:shadow-lg`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function LoyaltyDashboard() {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [customersData, statsData] = await Promise.all([
        loyaltyAPI.getCustomers(),
        loyaltyAPI.getStats()
      ]);
      setCustomers(customersData.results || customersData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier) => {
    const colors = {
      bronze: 'bg-orange-500',
      silver: 'bg-gray-400',
      gold: 'bg-yellow-500',
      platinum: 'bg-purple-500'
    };
    return colors[tier] || colors.bronze;
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Loyalty Program
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard
          title="Total Customers"
          value={stats?.total_customers || 0}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Points Issued"
          value={stats?.total_points || 0}
          icon={Star}
          color="bg-yellow-500"
        />
        <StatCard
          title="Rewards Redeemed"
          value={stats?.rewards_redeemed || 0}
          icon={Gift}
          color="bg-green-500"
        />
        <StatCard
          title="Active Members"
          value={stats?.active_members || 0}
          icon={TrendingUp}
          color="bg-purple-500"
        />
      </div>

      {/* Tier Distribution */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Tier Distribution
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {['bronze', 'silver', 'gold', 'platinum'].map((tier) => (
            <div key={tier} className="text-center">
              <div className={`w-16 h-16 mx-auto rounded-full ${getTierColor(tier)} flex items-center justify-center mb-2`}>
                <Star className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {tier}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.[`${tier}_count`] || 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-lg border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Top Customers
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Visits
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {customers.slice(0, 10).map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getTierColor(customer.tier)}`}>
                      {customer.tier.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {customer.loyalty_points}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    ₵{parseFloat(customer.total_spent).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {customer.visits_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

