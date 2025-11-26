import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { productsAPI, salesAPI } from '../../api';
import { PAYMENT_METHODS, PAYSTACK_PUBLIC_KEY } from '../../config/constants';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Smartphone,
  ShoppingCart,
} from 'lucide-react';

export default function CashierSales() {
  const { selectedShop, User } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (selectedShop) {
      loadProducts();
    }
  }, [selectedShop, searchTerm]);

  useEffect(() => {
    // Focus search input on mount and keyboard shortcuts
    const handleKeyPress = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart]);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll({
        shop: selectedShop.id,
        search: searchTerm,
      });
      setProducts(response.results || response);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.current_stock) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        alert('Not enough stock available');
      }
    } else {
      if (product.current_stock > 0) {
        setCart([
          ...cart,
          {
            product,
            quantity: 1,
            unit_price: parseFloat(product.unit_price),
            discount: 0,
          },
        ]);
      } else {
        alert('Product out of stock');
      }
    }

    // Clear search after adding
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const updateQuantity = (productId, delta) => {
    setCart(
      cart
        .map((item) => {
          if (item.product.id === productId) {
            const newQuantity = item.quantity + delta;
            if (newQuantity <= 0) return null;
            if (newQuantity > item.product.current_stock) {
              alert('Not enough stock available');
              return item;
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const updateDiscount = (productId, discount) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? { ...item, discount: parseFloat(discount) || 0 }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + item.unit_price * item.quantity - item.discount;
    }, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }
    setShowPaymentModal(true);
  };

  const downloadReceipt = async (saleId) => {
    try {
      const blob = await salesAPI.printReceipt(saleId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt_${saleId.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      const saleData = {
        shop_id: selectedShop.id,
        payment_method: paymentMethod,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
        })),
      };

      const response = await salesAPI.create(saleData);

      if (paymentMethod === PAYMENT_METHODS.CASH) {
        // Cash payment completed - download receipt
        alert('Sale completed successfully!');

        // Download receipt
        if (response.id) {
          await downloadReceipt(response.id);
        }

        clearCart();
        setShowPaymentModal(false);
      } else {
        // Redirect to Paystack for mobile money/card payment
        if (response.payment?.authorization_url) {
          window.location.href = response.payment.authorization_url;
        }
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert(error.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '', email: '' });
    setPaymentMethod(PAYMENT_METHODS.CASH);
    searchInputRef.current?.focus();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Left Side - Product Search & Selection */}
      <div className="lg:w-1/2 flex flex-col gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products (SKU or Name)... Press F2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Products
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.current_stock === 0}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-lg ${product.current_stock === 0
                    ? 'opacity-50 cursor-not-allowed border-gray-300 dark:border-gray-600'
                    : 'border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500'
                  }`}
              >
                <div className="font-semibold text-gray-900 dark:text-white">
                  {product.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  SKU: {product.sku}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    ₵{parseFloat(product.unit_price).toFixed(2)}
                  </span>
                  <span
                    className={`text-sm ${product.current_stock > product.reorder_level
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-orange-600 dark:text-orange-400'
                      }`}
                  >
                    Stock: {product.current_stock}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Cart */}
      <div className="lg:w-1/2 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              Cart ({cart.length} items)
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p>Cart is empty</p>
              <p className="text-sm">Search and add products to begin</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {item.product.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      ₵{item.unit_price.toFixed(2)} each
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="p-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Discount:
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) =>
                        updateDiscount(item.product.id, e.target.value)
                      }
                      className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-600 dark:text-white text-sm"
                    />
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ₵
                      {(
                        item.unit_price * item.quantity -
                        item.discount
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex justify-between items-center text-2xl font-bold">
            <span className="text-gray-900 dark:text-white">Total:</span>
            <span className="text-blue-600 dark:text-blue-400">
              ₵{calculateTotal().toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-lg transition-colors"
          >
            Checkout (F3)
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Complete Payment
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setPaymentMethod(PAYMENT_METHODS.CASH)}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${paymentMethod === PAYMENT_METHODS.CASH
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600'
                      }`}
                  >
                    <DollarSign className="w-6 h-6" />
                    <span className="text-sm">Cash</span>
                  </button>
                  <button
                    onClick={() =>
                      setPaymentMethod(PAYMENT_METHODS.MOBILE_MONEY)
                    }
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${paymentMethod === PAYMENT_METHODS.MOBILE_MONEY
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600'
                      }`}
                  >
                    <Smartphone className="w-6 h-6" />
                    <span className="text-sm">MoMo</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 ${paymentMethod === PAYMENT_METHODS.CARD
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-300 dark:border-gray-600'
                      }`}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span className="text-sm">Card</span>
                  </button>
                </div>
              </div>

              {paymentMethod !== PAYMENT_METHODS.CASH && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Customer Phone
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Customer Email
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-xl font-bold mb-4">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    ₵{calculateTotal().toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}