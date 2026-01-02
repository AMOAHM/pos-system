// src/components/AuthDebug.jsx
import { useEffect } from 'react';
import { useAuth } from '../contexts/Authcontext';

export const AuthDebug = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('=== AUTH DEBUG ===');
    console.log('User:', user);
    console.log('Is Authenticated:', isAuthenticated);
    console.log('Access Token:', localStorage.getItem('accessToken'));
    console.log('Refresh Token:', localStorage.getItem('refreshToken'));
    console.log('Stored User:', localStorage.getItem('user'));
    console.log('==================');
  }, [user, isAuthenticated]);

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 10, 
      right: 10, 
      background: 'black', 
      color: 'lime', 
      padding: '10px',
      fontSize: '10px',
      maxWidth: '300px',
      overflow: 'auto',
      zIndex: 9999
    }}>
      <h4>Auth Debug</h4>
      <p>User: {user?.username || 'None'}</p>
      <p>Role: {user?.role || 'None'}</p>
      <p>Token: {localStorage.getItem('accessToken') ? '✓ Present' : '✗ Missing'}</p>
      <p>Auth: {isAuthenticated ? '✓ Yes' : '✗ No'}</p>
    </div>
  );
};
