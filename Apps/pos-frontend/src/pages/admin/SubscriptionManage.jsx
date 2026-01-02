import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentSubscription, cancelSubscription, upgradeSubscription, getPlans, initializeSubscriptionPayment, verifySubscriptionPayment } from '../../api/subscriptions';
import { PAYSTACK_PUBLIC_KEY } from '../../config/constants';

export default function SubscriptionManage() {
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentReference, setPaymentReference] = useState(null);

  const { data: response = {}, isLoading: loadingCurrent, error: currentError } = useQuery({
    queryKey: ['current-subscription'],
    queryFn: getCurrentSubscription,
    refetchInterval: 1000 * 60 * 5,
    staleTime: 1000 * 60,
  });

  // Handle both old format (direct subscription data) and new format (wrapped in subscription key)
  const current = response?.subscription !== undefined ? response?.subscription : response;

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: getPlans,
    staleTime: 1000 * 60 * 5,
  });

  const cancelMut = useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: () => {
      qc.invalidateQueries(['current-subscription']);
      qc.refetchQueries(['current-subscription']);
      alert('Subscription cancelled successfully.');
    },
    onError: (err) => {
      console.error('Cancel error:', err);
      alert('Failed to cancel subscription: ' + (err.response?.data?.detail || err.message));
    },
  });

  // Initialize Paystack payment for upgrade
  const initPaymentMut = useMutation({
    mutationFn: (planId) => initializeSubscriptionPayment(planId),
    onSuccess: (data) => {
      if (data.skip_payment) {
        // Trial plan or free, upgrade directly
        upgradeMut.mutate(selectedPlan);
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

  // Verify payment and activate upgrade
  const verifyPaymentMut = useMutation({
    mutationFn: (reference) => verifySubscriptionPayment(reference),
    onSuccess: () => {
      qc.invalidateQueries(['current-subscription']);
      setSelectedPlan(null);
      setPaymentReference(null);
      alert('Subscription upgraded successfully!');
    },
    onError: (err) => {
      console.error('Payment verification error:', err);
      alert('Payment verification failed: ' + (err.response?.data?.detail || err.message));
      setSelectedPlan(null);
      setPaymentReference(null);
    },
  });

  const upgradeMut = useMutation({
    mutationFn: (plan) => upgradeSubscription(plan),
    onSuccess: () => {
      qc.invalidateQueries(['current-subscription']);
      qc.refetchQueries(['current-subscription']);
      setSelectedPlan(null);
      alert('Plan changed successfully!');
    },
    onError: (err) => {
      console.error('Upgrade error:', err);
      alert('Failed to change plan: ' + (err.response?.data?.detail || err.message));
    },
  });

  // Handle Paystack callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');

    if (reference && !paymentReference) {
      setPaymentReference(reference);
      verifyPaymentMut.mutate(reference);
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
        verifyPaymentMut.mutate(response.reference);
      },
      onClose: function () {
        setSelectedPlan(null);
      }
    });

    handler.openIframe();
  };

  const handleUpgrade = (planId) => {
    setSelectedPlan(planId);
    initPaymentMut.mutate(planId);
  };

  if (loadingCurrent) return <div className="p-6">Loading subscription...</div>;
  if (currentError) console.log('Current subscription error:', currentError);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Manage Subscription</h1>

      {!current ? (
        <div className="border rounded p-4 mb-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-gray-600">You have no active subscription.</p>
          <p className="text-xs text-gray-500 mt-2">Subscribe to a plan to add shops to your account.</p>
        </div>
      ) : (
        <div className="border rounded p-4 mb-4 bg-green-50 border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-green-900">{current.plan_display || current.plan}</h2>
              <p className="text-sm text-green-800">Status: {current.is_active ? '✓ Active' : '✗ Inactive'}</p>
              {current.trial_ends_at && (
                <p className="text-sm text-green-700">Trial ends: {new Date(current.trial_ends_at).toLocaleString()}</p>
              )}
              {current.ends_at && (
                <p className="text-sm text-green-700">Renews: {new Date(current.ends_at).toLocaleString()}</p>
              )}
            </div>
            <div className="space-x-2">
              {cancelMut.error && <p className="text-red-600 text-xs mb-2">{cancelMut.error.message}</p>}
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel your subscription?')) {
                    cancelMut.mutate();
                  }
                }}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
                disabled={cancelMut.isPending}
              >
                {cancelMut.isPending ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">Upgrade / Change Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="border rounded-lg p-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold">{plan.name}</div>
                  <div className="text-xs text-gray-500">{plan.interval}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {plan.currency === 'GHS' ? '₵' : (plan.currency || '$')} {plan.amount}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                {upgradeMut.error && <p className="text-red-600 text-xs mb-2">{upgradeMut.error.message}</p>}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60 w-full"
                  disabled={initPaymentMut.isPending || verifyPaymentMut.isPending || upgradeMut.isPending}
                >
                  {initPaymentMut.isPending || verifyPaymentMut.isPending || upgradeMut.isPending ? 'Processing...' : 'Select'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
