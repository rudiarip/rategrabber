// In development, use http://localhost:8000. In production/Docker behind Nginx, use relative path ''
const API_BASE = import.meta.env.VITE_API_BASE !== undefined 
  ? import.meta.env.VITE_API_BASE 
  : (import.meta.env.DEV ? 'http://localhost:8000' : '');

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export async function getCardInfo(code) {
  const res = await fetch(`${API_BASE}/api/cards/${code.toUpperCase()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Kartu tidak ditemukan');
  }
  return await res.json();
}

export async function searchPlaces(query) {
  if (!query || query.trim().length < 1) return { results: [] };
  const res = await fetch(`${API_BASE}/api/places/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Gagal mencari tempat');
  return await res.json();
}

export async function activateCard(code, { business_name, business_address, place_id, pin }) {
  const res = await fetch(`${API_BASE}/api/cards/${code.toUpperCase()}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ business_name, business_address, place_id, pin }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal mengaktifkan kartu');
  }
  return await res.json();
}

export async function verifyCardPin(code, pin) {
  const res = await fetch(`${API_BASE}/api/cards/${code.toUpperCase()}/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'PIN tidak valid');
  }
  return await res.json();
}

export async function updateCard(code, updateData) {
  const res = await fetch(`${API_BASE}/api/cards/${code.toUpperCase()}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal memperbarui kartu');
  }
  return await res.json();
}

export async function fetchAdminOverview() {
  const res = await fetch(`${API_BASE}/api/admin/overview`);
  if (!res.ok) throw new Error('Gagal memuat overview admin');
  return await res.json();
}

export async function fetchAdminCards({ status, search, page = 1, limit = 50 }) {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  if (search) params.append('search', search);

  const res = await fetch(`${API_BASE}/api/admin/cards?${params.toString()}`);
  if (!res.ok) throw new Error('Gagal memuat data kartu');
  return await res.json();
}

export async function generateBatchCards({ count, prefix, batch_name }) {
  const res = await fetch(`${API_BASE}/api/admin/cards/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: Number(count), prefix, batch_name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Gagal generate kartu massal');
  }
  return await res.json();
}

export async function resetCard(cardId) {
  const res = await fetch(`${API_BASE}/api/admin/cards/${cardId}/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Gagal mereset kartu');
  return await res.json();
}

export async function deleteCard(cardId) {
  const res = await fetch(`${API_BASE}/api/admin/cards/${cardId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Gagal menghapus kartu');
  return await res.json();
}

export { API_BASE };
