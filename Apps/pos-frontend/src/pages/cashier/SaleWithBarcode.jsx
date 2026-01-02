// Enhanced Sales Page with Barcode Scanner
// src/pages/cashier/SalesWithBarcode.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { productsAPI, salesAPI } from '../../api';
import BarcodeInput from '../../components/common/BarcodeInput';
import { ShoppingCart, AlertCircle } from 'lucide-react';

export default function SalesWithBarcode() {
  const { selectedShop } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (selectedShop) {
      loadProducts();
    }
  }, [selectedShop]);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll({
        shop: selectedShop.id
      });
      setProducts(response.results || response);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleBarcodeScan = (barcode) => {
    // Find product by SKU
    const product = products.find(p => p.sku === barcode);

    if (product) {
      addToCart(product);
      showNotification(`Added: ${product.name}`, 'success');
    } else {
      showNotification(`Product not found: ${barcode}`, 'error');
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.current_stock) {
        setCart(cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        showNotification('Not enough stock', 'error');
      }
    } else {
      if (product.current_stock > 0) {
        setCart([
          ...cart,
          {
            product,
            quantity: 1,
            unit_price: parseFloat(product.unit_price),
            discount: 0
          }
        ]);
      } else {
        showNotification('Product out of stock', 'error');
      }
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === 'success'
              ? 'bg-green-500 text-white'
              : notification.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          {notification.message}
        </div>
      )}

      {/* Barcode Scanner */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Scan Product
        </h3>
        <BarcodeInput
          onScan={handleBarcodeScan}
          placeholder="Scan barcode or enter SKU..."
        />
      </div>

      {/* Cart Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Cart ({cart.length} items)
        </h3>
        {/* Rest of cart implementation... */}
      </div>
    </div>
  );
}
