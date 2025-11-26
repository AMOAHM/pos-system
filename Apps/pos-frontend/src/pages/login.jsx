// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../config/constants';
import { Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.CASHIER);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [availableShops, setAvailableShops] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needShopSelection, setNeedShopSelection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password, role, selectedShopId || null);

    if (result.success) {
      // Redirect based on role
      if (role === ROLES.ADMIN) {
        navigate('/admin/dashboard');
      } else if (role === ROLES.MANAGER) {
        navigate('/manager/dashboard');
      } else {
        navigate('/cashier/sales');
      }
    } else {
      if (result.allowedShops && result.allowedShops.length > 0) {
        // Need shop selection
        setAvailableShops(result.allowedShops);
        setNeedShopSelection(true);
        setError('Please select a shop to continue');
      } else {
        setError(result.error);
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 px-4 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Login Box */}
      <div className="max-w-md w-full space-y-8 bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 relative z-10">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white drop-shadow-lg">
            POS System
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/50 text-white px-4 py-3 rounded-xl shadow-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/60" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-white/30 placeholder-white/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 backdrop-blur-sm"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/60" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-10 pr-12 py-3 border border-white/30 placeholder-white/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 backdrop-blur-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-end mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-white/90 mb-2"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-white/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 backdrop-blur-sm"
              >
                <option value={ROLES.CASHIER} className="bg-gray-800">Cashier</option>
                <option value={ROLES.MANAGER} className="bg-gray-800">Manager</option>
                <option value={ROLES.ADMIN} className="bg-gray-800">Admin</option>
              </select>
            </div>

            {/* Shop Selection (if needed) */}
            {needShopSelection && availableShops.length > 0 && (
              <div className="animate-fadeIn">
                <label
                  htmlFor="shop"
                  className="block text-sm font-medium text-white/90 mb-2"
                >
                  Select Shop
                </label>
                <select
                  id="shop"
                  name="shop"
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border border-white/30 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent bg-white/10 backdrop-blur-sm"
                  required
                >
                  <option value="" className="bg-gray-800">-- Select a shop --</option>
                  {availableShops.map((shop) => (
                    <option key={shop.id} value={shop.id} className="bg-gray-800">
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-white/60">
            © 2025 POS System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}