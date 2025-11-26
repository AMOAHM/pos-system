// src/utils/validators.js
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\d\s\-\+\(\)]+$/;
  return re.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateSKU = (sku) => {
  return sku && sku.length >= 3 && sku.length <= 50;
};

export const validatePassword = (password) => {
  return password && password.length >= 8;
};
