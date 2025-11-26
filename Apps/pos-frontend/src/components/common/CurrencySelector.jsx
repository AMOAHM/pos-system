// src/components/common/CurrencySelector.jsx
import React from 'react';
import { useCurrency } from '../../hooks/useCurrency';
import { DollarSign } from 'lucide-react';

export default function CurrencySelector() {
  const { currencies, selectedCurrency, changeCurrency } = useCurrency();

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-gray-500" />
        <select
          value={selectedCurrency?.code || ''}
          onChange={(e) => {
            const currency = currencies.find(c => c.code === e.target.value);
            changeCurrency(currency);
          }}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} - {currency.symbol}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
