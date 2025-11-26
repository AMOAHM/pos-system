// src/components/products/ProductImport.jsx
import React, { useState } from 'react';
import { productsAPI } from '../../api/products';
import { Upload, Download, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function ProductImport({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const extension = selectedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'xls', 'xlsx'].includes(extension)) {
        setFile(selectedFile);
        setResult(null);
      } else {
        alert('Please select a CSV or Excel file');
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await productsAPI.importProducts(formData);
      setResult(response);
      
      if (response.success) {
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check your file format.');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = `sku,name,description,unit_price,reorder_level,current_stock,shop_id,supplier_id,supplier_sku,cost_price
PROD001,Sample Product 1,Description here,10.99,20,100,1,1,SUP-PROD001,8.50
PROD002,Sample Product 2,Another description,15.50,15,50,1,1,SUP-PROD002,12.00`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
        Import Products
      </h2>

      <div className="space-y-4">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Download Template
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get the CSV template with sample data
              </p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
          <div className="text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-900 dark:text-white font-medium mb-2">
              {file ? file.name : 'Choose a file to import'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              CSV or Excel file (Max 5MB)
            </p>
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
            >
              Select File
            </label>
          </div>
        </div>

        {/* Import Button */}
        {file && (
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
          >
            {importing ? 'Importing...' : 'Import Products'}
          </button>
        )}

        {/* Result */}
        {result && (
          <div className={`p-4 rounded-lg ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  result.success
                    ? 'text-green-900 dark:text-green-200'
                    : 'text-red-900 dark:text-red-200'
                }`}>
                  {result.success ? 'Import Successful!' : 'Import Failed'}
                </p>
                {result.summary && (
                  <div className="mt-2 text-sm space-y-1">
                    <p className="text-gray-700 dark:text-gray-300">
                      Created: {result.summary.success_count}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      Updated: {result.summary.update_count}
                    </p>
                    {result.summary.skip_count > 0 && (
                      <p className="text-gray-700 dark:text-gray-300">
                        Skipped: {result.summary.skip_count}
                      </p>
                    )}
                    {result.summary.errors?.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium text-red-700 dark:text-red-300">
                          Errors:
                        </p>
                        <ul className="list-disc list-inside">
                          {result.summary.errors.slice(0, 5).map((error, i) => (
                            <li key={i} className="text-red-600 dark:text-red-400">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Import Instructions:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
            <li>Required columns: sku, name, unit_price, shop_id</li>
            <li>If SKU already exists in shop, stock will be added</li>
            <li>Optional: description, reorder_level, current_stock, supplier_id</li>
            <li>Use the template to ensure correct format</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
