import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import Can from '../../components/common/Can';
import Pagination from '../../components/common/Pagination';
import { 
  KeyRound, 
  LockKeyhole, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  X, 
  Search, 
  AlertCircle, 
  Info 
} from 'lucide-react';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState(null);
  const [name, setName] = useState('');
  const [logicName, setLogicName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  async function loadPermissions() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      params.append('page', String(page));
      params.append('limit', String(limit));

      const data = await apiRequest(`/api/v1/permissions?${params.toString()}`);
      setPermissions(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Gagal memuat permissions:', err);
    } finally {
      setLoading(false);
    }
  }

  // Unified fetch effect
  useEffect(() => {
    loadPermissions();
  }, [page, limit, debouncedSearch]);

  function openCreateModal() {
    setEditingPerm(null);
    setName('');
    setLogicName('');
    setErrorMsg('');
    setModalOpen(true);
  }

  function openEditModal(p) {
    setEditingPerm(p);
    setName(p.name);
    setLogicName(p.logic_name);
    setErrorMsg('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      name: name.trim(),
      logic_name: logicName.trim().toLowerCase(),
    };

    try {
      if (editingPerm) {
        await apiRequest(`/api/v1/permissions/${editingPerm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/v1/permissions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      loadPermissions();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan izin');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(permId, permName) {
    if (!window.confirm(`Yakin ingin menghapus permission '${permName}'?`)) return;
    try {
      await apiRequest(`/api/v1/permissions/${permId}`, { method: 'DELETE' });
      loadPermissions();
    } catch (err) {
      alert(err.message || 'Gagal menghapus permission');
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Kelola Hak Akses (Permissions)</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar izin aksi sistem yang dapat diberikan ke role pengguna di menu matriks hak akses
          </p>
        </div>

        <Can menu="/admin/permissions" action="create">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:from-amber-300 hover:to-orange-300 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Izin Baru</span>
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
            placeholder="Cari nama izin atau logic name..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Total: <strong className="text-white">{total}</strong> izin
        </span>
      </div>

      {/* Permissions Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative">
        {/* Subtle top loading line when refreshing */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/20 overflow-hidden z-20">
            <div className="w-1/2 h-full bg-amber-400 animate-pulse"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          {permissions.length === 0 && loading ? (
            <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span>Memuat permissions...</span>
            </div>
          ) : permissions.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              Tidak ada izin yang sesuai dengan pencarian.
            </div>
          ) : (
            <table className={`w-full text-left text-xs transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">Nama Izin (Display)</th>
                  <th className="py-3.5 px-5">Logic Name (Kode Akses)</th>
                  <th className="py-3.5 px-5">Kategori</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {permissions.map((p) => {
                  const isCore = p.id <= 4;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-400">{p.id}</td>
                      <td className="py-3.5 px-5 font-bold text-white flex items-center gap-2">
                        <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
                        <span>{p.name}</span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-emerald-400 bg-emerald-500/5 px-2 rounded inline-block my-2">
                        {p.logic_name}
                      </td>
                      <td className="py-3.5 px-5">
                        {isCore ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Izin Inti (Protected)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            Kustom / Alur Kerja
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Can menu="/admin/permissions" action="update">
                            <button
                              type="button"
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              title="Edit Izin"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </Can>

                          {!isCore && (
                            <Can menu="/admin/permissions" action="delete">
                              <button
                                type="button"
                                onClick={() => handleDelete(p.id, p.name)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                                title="Hapus Izin"
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

      {/* CREATE / EDIT PERMISSION MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white">
              {editingPerm ? `Edit Izin: ${editingPerm.name}` : 'Tambah Izin Baru'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Gunakan huruf kecil tanpa spasi untuk logic_name (contoh: export, print).
            </p>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Tampilan</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Export File"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Logic Name (Kode Akses)</label>
                <input
                  type="text"
                  required
                  value={logicName}
                  onChange={(e) => setLogicName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="contoh: export_file"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-medium text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Izin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
