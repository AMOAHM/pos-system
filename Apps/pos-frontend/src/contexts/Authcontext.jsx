// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [allowedShops, setAllowedShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedShops = localStorage.getItem('allowedShops');
        const storedSelectedShop = localStorage.getItem('selectedShop');
        const token = localStorage.getItem('accessToken');

        if (storedUser && storedUser !== 'undefined' && token) {
          setUser(JSON.parse(storedUser));
          setAllowedShops(storedShops ? JSON.parse(storedShops) : []);
          setSelectedShop(storedSelectedShop ? JSON.parse(storedSelectedShop) : null);
        } else {
          // Clear invalid/corrupted localStorage
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('allowedShops');
          localStorage.removeItem('selectedShop');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username, password, role, shopId = null) => {
    setLoading(true);
    try {
      const data = await authAPI.login(username, password, role, shopId);

      // Store tokens and user info
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('allowedShops', JSON.stringify(data.allowed_shops));

      setUser(data.user);
      setAllowedShops(data.allowed_shops);

      // Set selected shop
      if (data.selected_shop_id) {
        const shop = data.allowed_shops.find(s => s.id === data.selected_shop_id);
        setSelectedShop(shop);
        localStorage.setItem('selectedShop', JSON.stringify(shop));
      } else if (shopId) {
        const shop = data.allowed_shops.find(s => s.id === shopId);
        setSelectedShop(shop || null);
        if (shop) localStorage.setItem('selectedShop', JSON.stringify(shop));
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed',
        allowedShops: error.response?.data?.allowed_shops || [],
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('allowedShops');
    localStorage.removeItem('selectedShop');

    setUser(null);
    setAllowedShops([]);
    setSelectedShop(null);
  };

  // Switch shop
  const switchShop = (shop) => {
    setSelectedShop(shop);
    localStorage.setItem('selectedShop', JSON.stringify(shop));
  };

  // Send verification code for password change
  const sendVerificationCode = async (currentPassword) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users/send-verification-code/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ current_password: currentPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Failed to send verification code' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Change password with verification code
  const changePassword = async (currentPassword, newPassword, verificationCode) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/users/change-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error || 'Failed to change password' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Memoized context value
  const value = useMemo(
    () => ({
      user,
      allowedShops,
      selectedShop,
      loading,
      login,
      logout,
      switchShop,
      sendVerificationCode,
      changePassword,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isManager: user?.role === 'manager',
      isCashier: user?.role === 'cashier',
    }),
    [user, allowedShops, selectedShop, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};