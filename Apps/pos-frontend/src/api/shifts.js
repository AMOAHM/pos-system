// src/api/shifts.js
export const shiftsAPI = {
  startShift: async (payload) => {
    const res = await fetch("/api/shifts/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  endShift: async (payload) => {
    const res = await fetch("/api/shifts/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  getShifts: async () => {
    const res = await fetch("/api/shifts");
    return res.json();
  },
};