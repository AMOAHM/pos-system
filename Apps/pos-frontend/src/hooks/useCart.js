// src/hooks/useCart.js
import { useState, useCallback } from 'react';

/**
 * Custom hook for shopping cart management
 */
export const useCart = () => {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);

      if (existingItem) {
        // Update quantity if product already in cart
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      // Add new product to cart
      return [
        ...prev,
        {
          product,
          quantity,
          unit_price: parseFloat(product.unit_price),
          discount: 0
        }
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromCart]);

  const updateDiscount = useCallback((productId, discount) => {
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, discount: parseFloat(discount) || 0 }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      return total + (item.unit_price * item.quantity) - item.discount;
    }, 0);
  }, [cart]);

  const getItemCount = useCallback(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateDiscount,
    clearCart,
    getTotal,
    getItemCount
  };
};

