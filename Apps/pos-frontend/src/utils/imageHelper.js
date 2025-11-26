// src/utils/imageHelper.js

import { API_BASE_URL } from '../config/constants';

/**
 * Get the full URL for an image from the backend
 * @param {string} imagePath - The image path from the API (e.g., '/media/profiles/image.jpg' or 'profiles/image.jpg')
 * @returns {string} - The complete image URL
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // If already a full URL, return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // Remove /api from base URL (we only need the protocol + domain + port)
    const baseUrl = API_BASE_URL.replace('/api', '');

    // Ensure no double slashes
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    return `${baseUrl}${path}`;
};

/**
 * Generate a fallback avatar with initials
 * @param {string} name - User's full name
 * @returns {string} - Data URL for SVG avatar
 */
export const generateAvatarUrl = (name) => {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const colors = [
        '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];

    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
    <rect width="100" height="100" fill="${bgColor}"/>
    <text x="50" y="50" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text>
  </svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
};
