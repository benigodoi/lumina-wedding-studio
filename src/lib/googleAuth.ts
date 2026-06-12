/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabase';

// Read/write access to calendar events (includes listing them).
// Note: users who consented to the old read-only scope must re-consent.
export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';

const isNative = Capacitor.isNativePlatform();

const TOKEN_KEY = 'lumina_google_token';
const REFRESH_TOKEN_KEY = 'lumina_google_refresh_token';

export function getStoredGoogleToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeGoogleTokens(accessToken?: string | null, refreshToken?: string | null) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearGoogleTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Exchanges the stored refresh token for a fresh access token via our server
 * (Google requires the client secret, which must not live in the browser).
 * Returns the new access token, or null if refresh isn't possible.
 */
export async function tryRefreshGoogleToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  try {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const res = await fetch(`${apiBase}/api/google/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token) return null;
    localStorage.setItem(TOKEN_KEY, data.access_token);
    return data.access_token as string;
  } catch {
    return null;
  }
}

/**
 * Starts the Google OAuth flow. On web this redirects the page;
 * on native it opens a Chrome Custom Tab and the deep link handler
 * in App.tsx completes the session.
 * Returns an error message, or null if the flow was started.
 */
export async function signInWithGoogle(): Promise<string | null> {
  const redirectTo = isNative
    ? 'com.luminaweddingstudio.app://login-callback'
    : window.location.origin;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: GOOGLE_CALENDAR_SCOPE,
      redirectTo,
      queryParams: { access_type: 'offline', prompt: 'consent' },
      skipBrowserRedirect: isNative, // we handle the redirect ourselves on native
    },
  });

  if (error) return error.message;

  if (isNative && data.url) {
    await Browser.open({ url: data.url, windowName: '_self' });
  }
  return null;
}
