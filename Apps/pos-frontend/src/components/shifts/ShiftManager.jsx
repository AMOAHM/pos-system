// src/components/shifts/ShiftManager.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { shiftsAPI } from '../../api/shifts';
import { Clock, DollarSign, CheckCircle, XCircle } from 'lucide-react';

export default function ShiftManager() {
  const { user, selectedShop } = useAuth();
  const [activeShift, setActiveShift] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClockIn, setShowClockIn] = useState(false);
  const [showClockOut, setShowClockOut] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');

  useEffect(() => {
    loadShifts();
  }, [selectedShop]);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const data = await shiftsAPI.getShifts({
        shop: selectedShop?.id,
        cashier: user.id
      });
      setShifts(data.results || data);
      
      // Find active shift
      const active = (data.results || data).find(s => s.status === 'open');
      setActiveShift(active);
    } catch (error) {
      console.error('Failed to load shifts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (e) => {
    e.preventDefault();
    try {
      const shift = await shiftsAPI.clockIn({
        shop_id: selectedShop.id,
        opening_cash: parseFloat(openingCash),
        notes: ''
      });
      setActiveShift(shift);
      setShowClockIn(false);
      setOpeningCash('');
      loadShifts();
    } catch (error) {
      console.error('Failed to clock in:', error);
      alert('Failed to clock in. Please try again.');
    }
  };

  const handleClockOut = async (e) => {
    e.preventDefault();
    try {
      await shiftsAPI.clockOut(activeShift.id, {
        closing_cash: parseFloat(closingCash),
        notes: ''
      });
      setActiveShift(null);
      setShowClockOut(false);
      setClosingCash('');
      loadShifts();
    } catch (error) {
      console.error('Failed to clock out:', error);
      alert('Failed to clock out. Please try again.');
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Shift Management
        </h1>
        {!activeShift ? (
          <button
            onClick={() => setShowClockIn(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          >
            <Clock className="w-5 h-5" />
            Clock In
          </button>
        ) : (
          <button
            onClick={() => setShowClockOut(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            <Clock className="w-5 h-5" />
            Clock Out
          </button>
        )}
      </div>

      {/* Active Shift Card */}
      {activeShift && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Active Shift
            </h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full text-sm font-medium">
              Open
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Start Time</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(activeShift.start_time).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Opening Cash</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ₵{parseFloat(activeShift.opening_cash).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                ₵{parseFloat(activeShift.total_sales).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Transactions</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeShift.transactions_count}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shift History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Shift History
        </h2>
        <div className="space-y-4">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {new Date(shift.start_time).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(shift.start_time).toLocaleTimeString()} - 
                    {shift.end_time && ` ${new Date(shift.end_time).toLocaleTimeString()}`}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  shift.status === 'open'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {shift.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Opening</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₵{parseFloat(shift.opening_cash).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Closing</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {shift.closing_cash ? `₵${parseFloat(shift.closing_cash).toFixed(2)}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Sales</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₵{parseFloat(shift.total_sales).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Variance</p>
                  <p className={`font-semibold ${
                    shift.cash_difference >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {shift.cash_difference ? `₵${parseFloat(shift.cash_difference).toFixed(2)}` : '-'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clock In Modal */}
      {showClockIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Clock In
            </h3>
            <form onSubmit={handleClockIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Opening Cash Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClockIn(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clock Out Modal */}
      {showClockOut && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Clock Out
            </h3>
            <form onSubmit={handleClockOut} className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  Expected Cash: ₵{parseFloat(activeShift.expected_cash || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Closing Cash Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClockOut(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  End Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}