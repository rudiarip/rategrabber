import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import Can from '../../components/common/Can';
import Pagination from '../../components/common/Pagination';
import { Users, Plus, Shield, Check, X, Trash2, Edit3, RefreshCw, Search, Phone, Mail } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Create Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(2); // Default Admin

  // Edit Form State
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleId, setEditRoleId] = useState(2);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState('');

  // 1. Debounce search input only
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 2. Reset page on search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      params.append('page', String(page));
      params.append('limit', String(limit));

      const [uData, rData] = await Promise.all([
        apiRequest(`/api/v1/users?${params.toString()}`),
        apiRequest('/api/v1/roles'),
      ]);
      setUsers(uData.items || []);
      setTotal(uData.total || 0);
      setTotalPages(uData.total_pages || 1);
      setRoles(rData || []);
    } catch (err) {
      console.error('Gagal memuat data pengguna:', err);
    } finally {
      setLoading(false);
    }
  }

  // Unified effect
  useEffect(() => {
    loadData();
  }, [page, limit, debouncedSearch]);

  function openCreateModal() {
    setFullName('');
    setPhone('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRoleId(roles[1]?.id || 2);
    setErrorMsg('');
    setCreateModalOpen(true);
  }

  function openEditModal(u) {
    setEditUser(u);
    setEditFullName(u.full_name || '');
    setEditPhone(u.phone || '');
    setEditEmail(u.email || '');
    setEditRoleId(u.role_id || 2);
    setEditIsActive(u.is_active);
    setEditNewPassword('');
    setErrorMsg('');
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await apiRequest('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          username: username.trim(),
          email: email.trim(),
          password,
          role_id: Number(roleId),
        }),
      });
      setCreateModalOpen(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menambahkan pengguna');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateUser(e) {
    e.preventDefault();
    if (!editUser) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        full_name: editFullName.trim() || null,
        phone: editPhone.trim() || null,
        email: editEmail.trim(),
        role_id: Number(editRoleId),
        is_active: editIsActive,
      };
      if (editNewPassword.trim()) {
        payload.password = editNewPassword.trim();
      }

      await apiRequest(`/api/v1/users/${editUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setEditUser(null);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui pengguna');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(userId, userName) {
    if (!window.confirm(`Yakin ingin menghapus pengguna ${userName}? Akun tidak akan bisa login kembali.`)) return;
    try {
      await apiRequest(`/api/v1/users/${userId}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus pengguna');
    }
  }

  function formatDateTimeLocal(isoStr) {
    if (!isoStr) return '-';
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta'
      }) + ' WIB';
    } catch (e) {
      return isoStr;
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Manajemen Pengguna (Users)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola nama lengkap, kontak nomor telepon, akun akses, dan peran wewenang sistem
          </p>
        </div>

        <Can menu="/admin/users" action="create">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:from-amber-300 hover:to-orange-300 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        </Can>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama lengkap, no telepon, username, email..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Total: <strong className="text-white">{total}</strong> pengguna
        </span>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative">
        {/* Subtle top loading line when refreshing */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/20 overflow-hidden z-20">
            <div className="w-1/2 h-full bg-amber-400 animate-pulse"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          {users.length === 0 && loading ? (
            <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span>Memuat data pengguna...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              Tidak ada pengguna yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            <table className={`w-full text-left text-xs transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Nama Lengkap & Akun</th>
                  <th className="py-3.5 px-5">Kontak (Telepon & Email)</th>
                  <th className="py-3.5 px-5">Role Akses</th>
                  <th className="py-3.5 px-5">Dibuat Pada</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => {
                  const initial = (u.full_name || u.username || 'U').substring(0, 2).toUpperCase();
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-amber-400 font-bold flex items-center justify-center text-[11px] border border-slate-700 flex-shrink-0 shadow-sm">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {u.full_name || u.username}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Phone className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <span className="font-mono text-xs">{u.phone || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                            <span className="font-mono text-[11px]">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          u.role_id === 1 
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        }`}>
                          <Shield className="w-2.5 h-2.5" />
                          {u.role_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                        {formatDateTimeLocal(u.created_at)}
                      </td>

                      <td className="py-3.5 px-5">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <Check className="w-3.5 h-3.5" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                            <X className="w-3.5 h-3.5" />
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Can menu="/admin/users" action="update">
                            <button
                              type="button"
                              onClick={() => openEditModal(u)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              title="Edit Pengguna"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </Can>

                          {u.role_id !== 1 && (
                            <Can menu="/admin/users" action="delete">
                              <button
                                type="button"
                                onClick={() => handleDelete(u.id, u.username)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </Can>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Lightweight Pagination */}
        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* 1. CREATE USER MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setCreateModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white">Tambah Pengguna Baru</h3>
            <p className="text-xs text-slate-400 mt-0.5">Daftarkan akun staf baru untuk mengelola platform TapStar.</p>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="budi.santoso"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@perusahaan.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role Akses</label>
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Kata Sandi *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-medium text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setEditUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white">Edit Informasi Pengguna</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ubah data akun untuk <strong className="text-amber-400">@{editUser.username}</strong>
            </p>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">No. Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Role Akses</label>
                  <select
                    value={editRoleId}
                    disabled={editUser.role_id === 1}
                    onChange={(e) => setEditRoleId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ganti Kata Sandi (Opsional)
                </label>
                <input
                  type="password"
                  value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500 placeholder-slate-600"
                />
              </div>

              {editUser.role_id !== 1 && (
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="font-semibold">Akun Aktif (Dapat Login)</span>
                  </label>
                </div>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 rounded-xl font-medium text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
