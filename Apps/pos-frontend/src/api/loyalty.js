// src/api/loyalty.js
export const loyaltyAPI = {
  getPoints: async (userId) => {
    const res = await fetch(`/api/loyalty/${userId}/points`);
    return res.json();
  },
  addPoints: async (userId, points) => {
    const res = await fetch(`/api/loyalty/${userId}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });
    return res.json();
  },
  redeemReward: async (userId, rewardId) => {
    const res = await fetch(`/api/loyalty/${userId}/redeem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardId }),
    });
    return res.json();
  },
};