// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/Authcontext';
import { API_BASE_URL } from '../config/constants';
import { Eye, EyeOff, Lock, User, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/register-admin/`, formData);
            if (response.status === 201) {
                // Registration successful, redirect to login
                navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 relative overflow-hidden" style={{ backgroundImage: 'url("/login_background.png")' }}>
            {/* Overlay for better readability */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

            <div className="max-w-xl w-full space-y-8 bg-white/10 dark:bg-gray-800/30 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 relative z-10 animate-fadeIn">
                {/* Header */}
                <div className="text-center">
                    <Link to="/login" className="inline-flex items-center text-white/70 hover:text-white mb-6 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                    <div className="mx-auto w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-xl ring-1 ring-white/20 backdrop-blur-md overflow-hidden">
                        <img src="/shop-logo.png" alt="ApexPOS" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-3xl font-bold text-white drop-shadow-lg tracking-tight">
                        Create Admin Account
                    </h2>
                    <p className="mt-2 text-sm text-white/80">
                        Start your 7-day free trial today
                    </p>
                </div>

                <form className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="md:col-span-2 bg-red-500/20 backdrop-blur-sm border border-red-300/50 text-white px-4 py-3 rounded-xl shadow-lg">
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4 md:col-span-1">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">First Name</label>
                            <input
                                name="first_name"
                                type="text"
                                required
                                value={formData.first_name}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-4 py-3 border border-white/30 placeholder-white/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm"
                                placeholder="First Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 md:col-span-1">
                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">Last Name</label>
                            <input
                                name="last_name"
                                type="text"
                                required
                                value={formData.last_name}
                                onChange={handleChange}
                                className="appearance-none relative block w-full px-4 py-3 border border-white/30 placeholder-white/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 md:col-span-2">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-white/60" />
                                </div>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-white/30 placeholder-white/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm"
                                    placeholder="admin@example.com"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-white/60" />
                                </div>
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-white/30 placeholder-white/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm"
                                    placeholder="Choose a username"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-white/60" />
                                </div>
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none relative block w-full pl-10 pr-12 py-3 border border-white/30 placeholder-white/50 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/10 backdrop-blur-sm"
                                    placeholder="Enter a strong password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="md:col-span-2 w-full flex justify-center items-center gap-2 py-4 px-4 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-2xl transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Creating Account...
                            </>
                        ) : (
                            'Create Admin Account'
                        )}
                    </button>
                </form>

                <div className="text-center pt-4">
                    <p className="text-sm text-white/60">
                        Already have an account? <Link to="/login" className="text-white hover:underline">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
