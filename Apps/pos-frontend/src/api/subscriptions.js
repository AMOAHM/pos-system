import apiClient from './client';

const base = '/payments';

export async function getPlans() {
  // Expected backend: GET /api/subscriptions/plans/
  const resp = await apiClient.get(`${base}/plans/`);
  return resp.data;
}

export async function createSubscription(plan) {
  // Expected backend: POST /api/subscriptions/create/ { plan }
  const resp = await apiClient.post(`${base}/create/`, { plan });
  return resp.data;
}

export async function getCurrentSubscription() {
  // Expected backend: GET /api/subscriptions/current/
  const resp = await apiClient.get(`${base}/current/`);
  return resp.data;
}

export async function cancelSubscription() {
  // Expected backend: POST /api/subscriptions/cancel/
  const resp = await apiClient.post(`${base}/cancel/`);
  return resp.data;
}

export async function upgradeSubscription(plan) {
  // Expected backend: POST /api/subscriptions/upgrade/ { plan }
  const resp = await apiClient.post(`${base}/upgrade/`, { plan });
  return resp.data;
}

export async function initializeSubscriptionPayment(plan) {
  // Initialize Paystack payment for subscription
  const resp = await apiClient.post(`${base}/initialize-subscription/`, { plan });
  return resp.data;
}

export async function verifySubscriptionPayment(reference) {
  // Verify Paystack payment and activate subscription
  const resp = await apiClient.post(`${base}/verify-subscription/`, { reference });
  return resp.data;
}

export default {
  getPlans,
  createSubscription,
  getCurrentSubscription,
  cancelSubscription,
  upgradeSubscription,
  initializeSubscriptionPayment,
  verifySubscriptionPayment,
};
