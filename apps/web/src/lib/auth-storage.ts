'use client';

const ACCESS_TOKEN_KEY = 'dinedo.accessToken';

export function saveAccessToken(token: string) {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);

  // Remove any legacy browser-wide login.
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getAccessToken() {
  const token =
    window.sessionStorage.getItem(ACCESS_TOKEN_KEY);

  // Old localStorage authentication is no longer used.
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);

  return token;
}

export function clearAccessToken() {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}
