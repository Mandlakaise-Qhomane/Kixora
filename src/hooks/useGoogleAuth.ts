// ==============================================================================
// KIXORA GOOGLE AUTH HOOK (Phase 3D)
// Manages Google OAuth token acquisition via GSI Token Client.
// ==============================================================================

import { useState, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export interface GoogleAuthHook {
  token: string | null;
  requestToken: () => void;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const useGoogleAuth = (scopes: string[]): GoogleAuthHook => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('gdrive_token'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestToken = useCallback(() => {
    if (!window.google) {
      setError('Google SDK not loaded');
      return;
    }

    setIsLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id',
      scope: scopes.join(' '),
      callback: (response: any) => {
        setIsLoading(false);
        if (response.error) {
          setError(response.error_description || 'OAuth failed');
          return;
        }
        setToken(response.access_token);
        localStorage.setItem('gdrive_token', response.access_token);
      },
    });

    client.requestAccessToken();
  }, [scopes]);

  return {
    token,
    requestToken,
    isLoading,
    error,
    isAuthenticated: !!token,
  };
};
