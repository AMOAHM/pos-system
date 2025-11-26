import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { shiftsAPI } from "../../api/shifts";
import { Clock, DollarSign } from 'lucide-react';

export default function CashierShiftClock() {
  const { user, selectedShop } = useAuth();
  const [activeShift, setActiveShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveShift();
  }, []);

  const loadActiveShift = async () => {
    setLoading(true);
    try {
      const shifts = await shiftsAPI.getShifts({
        cashier: user.id,
        status: 'open'
      });
      
      if (shifts.results && shifts.results.length > 0) {
        setActiveShift(shifts.results[0]);
      }
    } catch (error) {
      console.error('Failed to load shift:', error);
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

  if (!activeShift) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
            No Active Shift
          </p>
          <p className="text-gray-500 dark:text-gray-500">
            Please clock in from the main menu to start your shift
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Current Shift
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Shift Started
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Date(activeShift.start_time).toLocaleTimeString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Opening Cash
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ₵{parseFloat(activeShift.opening_cash).toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Duration
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeShift.duration_minutes} min
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Today's Performance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Sales
              </p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                ₵{parseFloat(activeShift.total_sales).toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Transactions
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {activeShift.transactions_count}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cash Sales
              </p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                ₵{parseFloat(activeShift.cash_sales).toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Card Sales
              </p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                ₵{parseFloat(activeShift.card_sales).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}