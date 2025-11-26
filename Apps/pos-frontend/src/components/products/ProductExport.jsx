// src/components/products/ProductExport.jsx
import React, { useState } from 'react';
import { productsAPI } from '../../api/products';
import { Download, FileText, File } from 'lucide-react';

export default function ProductExport({ filters = {} }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);

    try {
      const blob = await productsAPI.exportProducts({
        ...filters,
        format
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleExport('csv')}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg"
      >
        <FileText className="w-4 h-4" />
        Export CSV
      </button>
      <button
        onClick={() => handleExport('xlsx')}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
      >
        <File className="w-4 h-4" />
        Export Excel
      </button>
    </div>
  );
}