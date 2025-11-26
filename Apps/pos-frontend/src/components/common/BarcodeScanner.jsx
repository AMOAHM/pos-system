// src/components/common/BarcodeScanner.jsx
import React, { useEffect, useState } from 'react';
import { useBarcode } from '../../hooks/useBarcode';
import { Camera, X, SwitchCamera, Loader } from 'lucide-react';

export default function BarcodeScanner({ onScan, onClose }) {
  const [lastScan, setLastScan] = useState('');
  const [scanCount, setScanCount] = useState(0);

  const {
    isScanning,
    error,
    cameras,
    selectedCamera,
    startScanning,
    stopScanning,
    switchCamera
  } = useBarcode((barcode) => {
    // Debounce multiple scans of same barcode
    if (barcode !== lastScan) {
      setLastScan(barcode);
      setScanCount(1);
      onScan(barcode);
      
      // Show feedback
      playBeep();
    } else {
      setScanCount(prev => prev + 1);
    }
  });

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.1
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleSwitchCamera = () => {
    const currentIndex = cameras.findIndex(c => c.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    switchCamera(cameras[nextIndex].id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h3 className="text-xl font-semibold">Scan Barcode</h3>
              <p className="text-sm text-gray-300">
                Position barcode in the frame
              </p>
            </div>
            
            <div className="flex gap-2">
              {cameras.length > 1 && (
                <button
                  onClick={handleSwitchCamera}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                  disabled={!isScanning}
                >
                  <SwitchCamera className="w-6 h-6 text-white" />
                </button>
              )}
              
              <button
                onClick={() => {
                  stopScanning();
                  onClose();
                }}
                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Scanner View */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          <div id="barcode-reader" className="w-full" />
          
          {!isScanning && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="w-12 h-12 text-white animate-spin" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-8 bg-black/80 rounded-lg">
                <Camera className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-white text-lg font-semibold mb-2">
                  Camera Error
                </p>
                <p className="text-gray-300">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Last Scan Display */}
        {lastScan && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="bg-green-500 text-white px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">Last Scanned</p>
              <p className="text-lg font-bold">{lastScan}</p>
              {scanCount > 1 && (
                <p className="text-sm opacity-80">
                  Scanned {scanCount} times
                </p>
              )}
            </div>
          </div>
        )}

        {/* Scanning Frame Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-64 h-64 border-4 border-blue-500 rounded-lg relative">
            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
            
            {/* Scanning line animation */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-blue-500 animate-scan" />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
