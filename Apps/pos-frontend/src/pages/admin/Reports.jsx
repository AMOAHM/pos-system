// src/pages/admin/Reports.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportsAPI } from '../../api/reports';
import { Download, Calendar, FileText } from 'lucide-react';

export default function AdminReports() {
  const { selectedShop, allowedShops, switchShop } = useAuth();
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleGenerateReport = async () => {
    if (!selectedShop) {
      alert('Please select a shop');
      return;
    }

    setLoading(true);
    try {
      const params = {
        shop: selectedShop.id,
        start_date: startDate,
        end_date: endDate
      };

      let data;
      if (reportType === 'sales') {
        data = await reportsAPI.getSalesReport(params);
      } else {
        data = await reportsAPI.getInventoryReport(params);
      }

      setReportData(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedShop) return;

    try {
      const blob = await reportsAPI.exportSalesCSV({
        shop: selectedShop.id,
        start_date: startDate,
        end_date: endDate
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Reports
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Generate Report
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Shop
            </label>
            <select
              value={selectedShop?.id || ''}
              onChange={(e) => {
                const shop = allowedShops.find(s => s.id === parseInt(e.target.value));
                switchShop(shop);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {allowedShops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Report Summary
              </h2>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {reportType === 'sales' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    ₵{(reportData.summary?.total_revenue || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reportData.summary?.total_transactions || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cash Sales</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ₵{(reportData.summary?.cash_sales || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Card Sales</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    ₵{(reportData.summary?.card_sales || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Products</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {reportData.summary?.total_products || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Stock</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reportData.summary?.total_stock || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Stock Value</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ₵{(reportData.summary?.total_value || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {reportData.summary?.low_stock_count || 0}
                  </p>
                </div>
              </div>
            )}
          </div>

          {reportType === 'sales' && reportData.top_products?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Top Products
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Quantity Sold
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {reportData.top_products.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {product.product__name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {product.total_quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          ₵{parseFloat(product.total_revenue).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
