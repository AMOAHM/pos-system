// src/components/common/BarcodeInput.jsx
import React, { useState } from 'react';
import { Camera, Keyboard } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { useKeyboardBarcode } from '../../hooks/useBarcode';

export default function BarcodeInput({ onScan, placeholder, className }) {
  const [showScanner, setShowScanner] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'keyboard'

  // Keyboard scanner for USB barcode scanners
  useKeyboardBarcode((barcode) => {
    if (scanMode === 'keyboard') {
      onScan(barcode);
      setManualInput('');
    }
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  return (
    <div className={className}>
      <div className="flex gap-2">
        {/* Manual input */}
        <form onSubmit={handleManualSubmit} className="flex-1 relative">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={placeholder || "Scan or enter barcode..."}
            className="w-full px-4 py-2 pr-24 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            {/* Keyboard scanner toggle */}
            <button
              type="button"
              onClick={() => setScanMode(scanMode === 'keyboard' ? 'manual' : 'keyboard')}
              className={`p-1.5 rounded transition-colors ${
                scanMode === 'keyboard'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
              }`}
              title={scanMode === 'keyboard' ? 'USB Scanner Active' : 'Enable USB Scanner'}
            >
              <Keyboard className="w-4 h-4" />
            </button>

            {/* Camera scanner button */}
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              title="Open Camera Scanner"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Scanner mode indicator */}
      {scanMode === 'keyboard' && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
          <Keyboard className="w-3 h-3" />
          USB Barcode Scanner Ready - Scan to add product
        </p>
      )}

      {/* Camera Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={(barcode) => {
            onScan(barcode);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
