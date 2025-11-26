// src/utils/barcode.js
/**
 * Barcode utility functions
 */

// Validate barcode format
export const validateBarcode = (barcode, type = 'any') => {
  const formats = {
    ean13: /^\d{13}$/,
    ean8: /^\d{8}$/,
    upc: /^\d{12}$/,
    code128: /^[\x00-\x7F]+$/,
    qr: /.+/,
    any: /.{4,}/
  };

  const pattern = formats[type] || formats.any;
  return pattern.test(barcode);
};

// Calculate EAN-13 check digit
export const calculateEAN13CheckDigit = (barcode) => {
  if (barcode.length !== 12) {
    throw new Error('EAN-13 requires 12 digits');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return barcode + checkDigit;
};

// Parse barcode to extract information
export const parseBarcode = (barcode) => {
  // Detect barcode type
  let type = 'unknown';
  let data = {};

  if (/^\d{13}$/.test(barcode)) {
    type = 'ean13';
    data = {
      countryCode: barcode.substring(0, 3),
      manufacturerCode: barcode.substring(3, 8),
      productCode: barcode.substring(8, 12),
      checkDigit: barcode[12]
    };
  } else if (/^\d{12}$/.test(barcode)) {
    type = 'upc';
    data = {
      systemDigit: barcode[0],
      manufacturerCode: barcode.substring(1, 6),
      productCode: barcode.substring(6, 11),
      checkDigit: barcode[11]
    };
  } else if (/^\d{8}$/.test(barcode)) {
    type = 'ean8';
  }

  return { type, barcode, data };
};

// Generate barcode SVG (simplified)
export const generateBarcodeSVG = (barcode, options = {}) => {
  const {
    width = 200,
    height = 100,
    displayValue = true
  } = options;

  // This is a simplified version - use a library like jsbarcode for production
  const bars = barcode.split('').map(char => {
    const code = char.charCodeAt(0);
    return code % 2 === 0 ? '1' : '0';
  }).join('');

  const barWidth = width / bars.length;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${bars.split('').map((bar, i) => {
        if (bar === '1') {
          return `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${height - 20}" fill="black" />`;
        }
        return '';
      }).join('')}
      ${displayValue ? `<text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="14" fill="black">${barcode}</text>` : ''}
    </svg>
  `;

  return svg;
};

// Check if device has camera
export const hasCameraSupport = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    return false;
  }
};
