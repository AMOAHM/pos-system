import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlans, createSubscription, initializeSubscriptionPayment, verifySubscriptionPayment } from '../../api/subscriptions';
import { PAYSTACK_PUBLIC_KEY } from '../../config/constants';
import {
  Check,
  Zap,
  Star,
  Crown,
  Sparkles,
  TrendingUp,
  Shield,
  Users,
  Infinity
} from 'lucide-react';

export default function Subscriptions() {
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentReference, setPaymentReference] = useState(null);

  const { data: plans = [], isLoading, error } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
    staleTime: 1000 * 60 * 5,
    retry: 1,
    onError: (err) => {
      console.error('Error fetching plans:', err);
    }
  });

  // Free trial subscription (no payment)
  const subscribeMut = useMutation({
    mutationFn: (planId) => createSubscription(planId),
    onSuccess: () => {
      qc.invalidateQueries(['current-subscription']);
      qc.refetchQueries(['current-subscription']);
      setSelectedPlan(null);
      alert('Free trial activated successfully!');
    },
    onError: (err) => {
      console.error('Subscribe error:', err);
      alert('Failed to activate trial: ' + (err.response?.data?.detail || err.message));
    },
  });

  // Initialize Paystack payment
  const initPaymentMut = useMutation({
    mutationFn: (planId) => initializeSubscriptionPayment(planId),
    onSuccess: (data) => {
      if (data.skip_payment) {
        // Trial plan, create subscription directly
        subscribeMut.mutate(selectedPlan);
      } else {
        // Open Paystack popup
        openPaystackPopup(data);
      }
    },
    onError: (err) => {
      console.error('Payment initialization error:', err);
      alert('Failed to initialize payment: ' + (err.response?.data?.detail || err.message));
      setSelectedPlan(null);
    },
  });

  // Verify payment and create subscription
  const verifyPaymentMut = useMutation({
    mutationFn: (reference) => verifySubscriptionPayment(reference),
    onSuccess: () => {
      qc.invalidateQueries(['current-subscription']);
      setSelectedPlan(null);
      setPaymentReference(null);
      alert('Subscription activated successfully!');
    },
    onError: (err) => {
      console.error('Payment verification error:', err);
      alert('Payment verification failed: ' + (err.response?.data?.detail || err.message));
      setSelectedPlan(null);
      setPaymentReference(null);
    },
  });

  // Handle Paystack callback (when user returns from payment)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');

    if (reference && !paymentReference) {
      setPaymentReference(reference);
      verifyPaymentMut.mutate(reference);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Open Paystack popup
  const openPaystackPopup = (paymentData) => {
    if (!window.PaystackPop) {
      alert('Paystack library not loaded. Please refresh the page.');
      setSelectedPlan(null);
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      access_code: paymentData.access_code,
      callback: function (response) {
        // Payment successful
        verifyPaymentMut.mutate(response.reference);
      },
      onClose: function () {
        // Payment cancelled
        setSelectedPlan(null);
      }
    });

    handler.openIframe();
  };

  const handleSubscribe = (planId) => {
    setSelectedPlan(planId);
    initPaymentMut.mutate(planId);
  };

  // Loading state with modern spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading plans...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex items-center justify-center p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md">
          <div className="text-red-600 dark:text-red-400 text-center">
            <p className="font-semibold text-lg mb-2">Error Loading Plans</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Default plans with features if API doesn't provide enough data
  const enhancedPlans = plans.length > 0 ? plans.map((plan, index) => {
    const planTypes = ['Free', 'Pro', 'Enterprise'];
    const planType = plan.name || planTypes[index] || 'Plan';

    return {
      ...plan,
      type: planType,
      features: plan.features || getDefaultFeatures(planType),
      popular: plan.popular || index === 1,
      gradient: getGradient(planType, index),
      icon: getIcon(planType, index)
    };
  }) : getDefaultPlans();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg">
            <Sparkles className="w-4 h-4" />
            <span>Flexible Pricing Plans</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h1>

          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Scale your POS business with our powerful subscription tiers.
            From startups to enterprises, we've got you covered.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {enhancedPlans.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            const isProcessing = subscribeMut.isLoading && selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative group ${isPopular ? 'md:-mt-4 md:mb-4' : ''}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Card */}
                <div
                  className={`relative h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl border-2 transition-all duration-500 overflow-hidden
                    ${isPopular
                      ? 'border-purple-300 dark:border-purple-600 shadow-purple-200 dark:shadow-purple-900/50'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                    hover:shadow-2xl hover:scale-105 hover:-translate-y-2`}
                >
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${plan.gradient}`}></div>

                  {/* Content */}
                  <div className="relative z-10 p-8">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-2xl ${plan.gradient} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name || plan.type}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 min-h-[40px]">
                      {plan.description || getDefaultDescription(plan.type)}
                    </p>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-gray-900 dark:text-white">
                          {plan.currency === 'GHS' ? '₵' : (plan.currency || '$')}{plan.amount || 0}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          /{plan.interval || 'month'}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 group/item">
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full ${plan.gradient} flex items-center justify-center mt-0.5 group-hover/item:scale-110 transition-transform`}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      disabled={isProcessing}
                      onClick={() => handleSubscribe(plan.id)}
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                        ${isPopular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-300 dark:shadow-purple-900/50'
                          : `${plan.gradient} hover:shadow-xl`
                        }`}
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        'Get Started'
                      )}
                    </button>

                    {/* Error Message */}
                    {subscribeMut.error && selectedPlan === plan.id && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-3 text-center">
                        {subscribeMut.error.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Section */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-8 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl px-8 py-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">1000+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Instant Activation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

// Helper functions
function getGradient(planType, index) {
  const gradients = {
    'Free': 'bg-gradient-to-br from-blue-500 to-blue-600',
    'Pro': 'bg-gradient-to-br from-purple-500 to-purple-600',
    'Enterprise': 'bg-gradient-to-br from-pink-500 to-pink-600',
  };

  const defaultGradients = [
    'bg-gradient-to-br from-blue-500 to-blue-600',
    'bg-gradient-to-br from-purple-500 to-purple-600',
    'bg-gradient-to-br from-pink-500 to-pink-600',
  ];

  return gradients[planType] || defaultGradients[index % 3];
}

function getIcon(planType, index) {
  const icons = {
    'Free': Zap,
    'Pro': Crown,
    'Enterprise': Infinity,
  };

  const defaultIcons = [Zap, Crown, Infinity];
  return icons[planType] || defaultIcons[index % 3];
}

function getDefaultFeatures(planType) {
  const features = {
    'Free': [
      'Up to 1 shop location',
      'Basic inventory management',
      '100 products limit',
      'Email support',
      'Basic reporting',
    ],
    'Pro': [
      'Up to 5 shop locations',
      'Advanced inventory tracking',
      'Unlimited products',
      'Priority support 24/7',
      'Advanced analytics',
      'Multi-currency support',
      'Custom branding',
    ],
    'Enterprise': [
      'Unlimited shop locations',
      'Enterprise-grade security',
      'Unlimited everything',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced API access',
      'White-label options',
      'SLA guarantee',
    ],
  };

  return features[planType] || [
    'Custom features',
    'Premium support',
    'Advanced analytics',
  ];
}

function getDefaultDescription(planType) {
  const descriptions = {
    'Free': 'Perfect for getting started with basic POS needs',
    'Pro': 'Ideal for growing businesses that need more power',
    'Enterprise': 'Complete solution for large-scale operations',
  };

  return descriptions[planType] || 'A great plan for your business';
}

function getDefaultPlans() {
  return [
    {
      id: 1,
      name: 'Free',
      type: 'Free',
      description: 'Perfect for getting started with basic POS needs',
      amount: 0,
      currency: '₵',
      interval: 'month',
      popular: false,
      features: getDefaultFeatures('Free'),
      gradient: getGradient('Free', 0),
      icon: getIcon('Free', 0),
    },
    {
      id: 2,
      name: 'Pro',
      type: 'Pro',
      description: 'Ideal for growing businesses that need more power',
      amount: 99,
      currency: '₵',
      interval: 'month',
      popular: true,
      features: getDefaultFeatures('Pro'),
      gradient: getGradient('Pro', 1),
      icon: getIcon('Pro', 1),
    },
    {
      id: 3,
      name: 'Enterprise',
      type: 'Enterprise',
      description: 'Complete solution for large-scale operations',
      amount: 299,
      currency: '₵',
      interval: 'month',
      popular: false,
      features: getDefaultFeatures('Enterprise'),
      gradient: getGradient('Enterprise', 2),
      icon: getIcon('Enterprise', 2),
    },
  ];
}
