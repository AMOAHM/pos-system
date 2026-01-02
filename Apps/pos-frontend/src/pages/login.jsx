// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [needShopSelection, setNeedShopSelection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMsg(location.state.message);
      // Clear state so message doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
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
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 relative overflow-hidden" style={{ backgroundImage: 'url("/login_background.png")' }}>
      {/* Premium Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>

      {/* Login Box */}
      <div className="max-w-md w-full space-y-8 bg-white/10 dark:bg-gray-800/20 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-white/20 relative z-10 animate-scaleIn">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl ring-1 ring-white/20 backdrop-blur-md overflow-hidden animate-pulse-slow">
            <img src="/shop-logo.png" alt="ApexPOS" className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
          <h2 className="text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">
            POS System
          </h2>
          <p className="mt-2 text-sm text-white/80 font-medium">
            Welcome back! Please enter your details.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/20 backdrop-blur-md border border-red-300/40 text-white px-4 py-3 rounded-2xl shadow-lg animate-shake">
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="bg-green-500/20 backdrop-blur-md border border-green-300/40 text-white px-4 py-3 rounded-2xl shadow-lg">
              <p className="text-sm font-semibold">{successMsg}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Username Field */}
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/40 group-focus-within:text-white/80 transition-colors" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-4 py-3.5 border border-white/20 placeholder-white/30 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent bg-white/5 backdrop-blur-sm transition-all text-lg"
                  placeholder="Username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/40 group-focus-within:text-white/80 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full pl-12 pr-14 py-3.5 border border-white/20 placeholder-white/30 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent bg-white/5 backdrop-blur-sm transition-all text-lg"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Role</label>
              <select
                id="role"
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3.5 border border-white/20 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent bg-white/5 backdrop-blur-sm text-lg"
              >
                <option value={ROLES.CASHIER} className="bg-gray-900">Cashier</option>
                <option value={ROLES.MANAGER} className="bg-gray-900">Manager</option>
                <option value={ROLES.ADMIN} className="bg-gray-900">Admin</option>
              </select>
            </div>

            {/* Shop Selection (if needed) */}
            {needShopSelection && availableShops.length > 0 && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 ml-1">Select Shop</label>
                <select
                  id="shop"
                  name="shop"
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3.5 border border-white/20 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent bg-white/5 backdrop-blur-sm text-lg"
                  required
                >
                  <option value="" className="bg-gray-900">-- Choose a shop --</option>
                  {availableShops.map((shop) => (
                    <option key={shop.id} value={shop.id} className="bg-gray-900">
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <Link
              to="/forgot-password"
              className="text-sm text-white/60 hover:text-white transition-colors font-medium"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-4 px-4 text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Admin Registration Link */}
        <div className="text-center pt-2">
          <p className="text-white/60 text-sm font-medium">
            Don't have an account? <Link to="/register" className="text-white hover:underline font-bold">Register Admin</Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
            © 2026 POS System • Premium Version
          </p>
        </div>
      </div>
    </div>
  );
}
