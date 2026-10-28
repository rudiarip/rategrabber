// TapStar API bridge for public portals and simulator

import { API_BASE, apiRequest } from '../api/client';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (!res.ok) return { status: 'offline' };
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export async function getCardInfo(code) {
  const cleanCode = code.toUpperCase();
  return await apiRequest(`/api/v1/cards/public/${cleanCode}`);
}

export async function searchPlaces(query) {
  if (!query || query.trim().length < 1) return { results: [] };
  return await apiRequest(`/api/v1/places/search?q=${encodeURIComponent(query)}`);
}

export async function activateCard(code, { business_name, business_address, place_id, pin }) {
  return await apiRequest('/api/v1/cards/activate', {
    method: 'POST',
    body: JSON.stringify({
      code: code.toUpperCase(),
      business_name,
      business_address,
      place_id,
      admin_pin: pin
    }),
  });
}

export { API_BASE };
