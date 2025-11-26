// src/hooks/useSettings.js
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { usersAPI } from '../api/users';

/**
 * Custom hook for user settings management
 */
export const useSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    font_size: 'medium',
    language: 'en',
    dark_mode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.settings) {
      setSettings(user.settings);
    }
    setLoading(false);
  }, [user]);

  const updateSettings = async (newSettings) => {
    setSaving(true);
    try {
      const updated = await usersAPI.updateSettings(user.id, newSettings);
      setSettings(updated);
      return updated;
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    return updateSettings(newSettings);
  };

  return {
    settings,
    loading,
    saving,
    updateSettings,
    updateSetting
  };
};

