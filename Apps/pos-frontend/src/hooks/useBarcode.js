// src/hooks/useBarcode.js
import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useBarcode = (onScan, options = {}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const scannerRef = useRef(null);

  // Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        setCameras(devices);
        if (devices.length > 0) {
          // Prefer back camera for barcode scanning
          const backCamera = devices.find(
            (d) => d.label.toLowerCase().includes('back') || 
                   d.label.toLowerCase().includes('rear')
          );
          setSelectedCamera(backCamera?.id || devices[0].id);
        }
      })
      .catch((err) => {
        console.error('Failed to get cameras:', err);
        setError('Camera access denied or not available');
      });
  }, []);

  // Start scanning
  const startScanning = async (elementId = 'barcode-reader') => {
    if (isScanning) return;

    try {
      setError(null);
      
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        ...options
      };

      await scanner.start(
        selectedCamera,
        config,
        (decodedText, decodedResult) => {
          onScan(decodedText, decodedResult);
        },
        (errorMessage) => {
          // Ignore scanning errors (they're frequent)
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera');
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    if (!scannerRef.current || !isScanning) return;

    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
      setIsScanning(false);
    } catch (err) {
      console.error('Failed to stop scanner:', err);
    }
  };

  // Switch camera
  const switchCamera = async (cameraId) => {
    if (isScanning) {
      await stopScanning();
    }
    setSelectedCamera(cameraId);
    if (isScanning) {
      await startScanning();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  return {
    isScanning,
    error,
    cameras,
    selectedCamera,
    startScanning,
    stopScanning,
    switchCamera
  };
};

// Keyboard barcode scanner hook (for USB scanners)
export const useKeyboardBarcode = (onScan, options = {}) => {
  const [buffer, setBuffer] = useState('');
  const timeoutRef = useRef(null);

  const {
    minLength = 4,
    maxLength = 50,
    timeout = 100, // ms between characters
    endKey = 'Enter'
  } = options;

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Clear timeout on any keypress
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Check for end key
      if (e.key === endKey) {
        if (buffer.length >= minLength && buffer.length <= maxLength) {
          onScan(buffer);
          setBuffer('');
        }
        return;
      }

      // Accumulate characters
      if (e.key.length === 1) {
        const newBuffer = buffer + e.key;
        setBuffer(newBuffer);

        // Set timeout to clear buffer if scanning stops
        timeoutRef.current = setTimeout(() => {
          setBuffer('');
        }, timeout);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [buffer, minLength, maxLength, timeout, endKey, onScan]);

  return { buffer };
};

