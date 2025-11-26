// src/hooks/useCurrency.js
import { useState, useEffect, createContext, useContext } from 'react';
import { currenciesAPI } from '../api/currencies';

const CurrencyContext = createContext(null);

export const CurrencyProvider = ({ children }) => {
  const [currencies, setCurrencies] = useState([]);
  const [defaultCurrency, setDefaultCurrency] = useState(null);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const [allCurrencies, defCurrency] = await Promise.all([
        currenciesAPI.getAll(),
        currenciesAPI.getDefault()
      ]);

      setCurrencies(allCurrencies);
      setDefaultCurrency(defCurrency);
      setSelectedCurrency(
        JSON.parse(localStorage.getItem('selectedCurrency')) || defCurrency
      );
    } catch (error) {
      console.error('Failed to load currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeCurrency = (currency) => {
    setSelectedCurrency(currency);
    localStorage.setItem('selectedCurrency', JSON.stringify(currency));
  };

  const convertAmount = async (amount, toCurrency = selectedCurrency) => {
    if (!defaultCurrency || !toCurrency) return amount;

    try {
      const result = await currenciesAPI.convert(
        amount,
        defaultCurrency.code,
        toCurrency.code
      );
      return result.converted_amount;
    } catch (error) {
      console.error('Conversion failed:', error);
      return amount;
    }
  };

  const formatAmount = (amount, currency = selectedCurrency) => {
    if (!currency) return amount;

    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: currency.decimal_places,
      maximumFractionDigits: currency.decimal_places
    }).format(amount);

    if (currency.symbol_position === 'before') {
      return `${currency.symbol}${formatted}`;
    } else {
      return `${formatted} ${currency.symbol}`;
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        defaultCurrency,
        selectedCurrency,
        loading,
        changeCurrency,
        convertAmount,
        formatAmount
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};
