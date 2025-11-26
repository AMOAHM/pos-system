// src/pages/manager/Products.jsx
import React from 'react';
import ProductList from '../../components/products/ProductList';

export default function ManagerProducts() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Products Management
      </h1>
      <ProductList />
    </div>
  );
}