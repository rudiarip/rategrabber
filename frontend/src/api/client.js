// TapStar API Client with JWT Bearer Token Injection and Error Interception

const API_BASE = import.meta.env.VITE_API_BASE !== undefined 
  ? import.meta.env.VITE_API_BASE 
  : (import.meta.env.DEV ? 'http://localhost:8000' : '');

export const TOKEN_STORAGE_KEY = 'tapstar_token';
export const USER_STORAGE_KEY = 'tapstar_user';

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Sesi kedaluwarsa
    setToken(null);
    setStoredUser(null);
    window.dispatchEvent(new CustomEvent('tapstar:unauthorized'));
  }

  // Handle empty or blob/zip responses
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/zip') || contentType.includes('image/')) {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.blob();
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || data.message || `Terjadi kesalahan (HTTP ${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export { API_BASE };
