import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import Can from '../../components/common/Can';
import Pagination from '../../components/common/Pagination';
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  X, 
  Search, 
  AlertCircle 
} from 'lucide-react';

export default function MenusPage() {
  const { refreshUserData } = useAuth();
  const [menus, setMenus] = useState([]);
  const [allParents, setAllParents] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(0);
  const [isParent, setIsParent] = useState(false);
  const [icon, setIcon] = useState('Menu');
  const [link, setLink] = useState('');
  const [orderNo, setOrderNo] = useState(0);

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

      const [pagedData, fullData] = await Promise.all([
        apiRequest(`/api/v1/menus?${params.toString()}`),
        apiRequest('/api/v1/menus?all=true'),
      ]);

      setMenus(pagedData.items || []);
      setTotal(pagedData.total || 0);
      setTotalPages(pagedData.total_pages || 1);
      setAllParents((fullData.items || []).filter((m) => m.is_parent));
    } catch (err) {
      console.error('Gagal memuat menu:', err);
    } finally {
      setLoading(false);
    }
  }

  // Unified fetch effect
  useEffect(() => {
    loadData();
  }, [page, limit, debouncedSearch]);

  function openCreateModal() {
    setEditingMenu(null);
    setName('');
    setParentId(0);
    setIsParent(false);
    setIcon('Menu');
    setLink('');
    setOrderNo(total + 1);
    setErrorMsg('');
    setModalOpen(true);
  }

  function openEditModal(m) {
    setEditingMenu(m);
    setName(m.name);
    setParentId(m.parent_id || 0);
    setIsParent(m.is_parent);
    setIcon(m.icon || 'Menu');
    setLink(m.link || '');
    setOrderNo(m.order_no || 0);
    setErrorMsg('');
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      name: name.trim(),
      parent_id: parentId > 0 ? Number(parentId) : null,
      is_parent: isParent,
      icon: icon.trim() || null,
      link: isParent ? null : (link.trim() || null),
      order_no: Number(orderNo),
    };

    try {
      if (editingMenu) {
        await apiRequest(`/api/v1/menus/${editingMenu.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/v1/menus', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      loadData();
      refreshUserData(); // Refresh sidebar dynamically
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan menu');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(menuId, menuName) {
    if (!window.confirm(`Yakin ingin menghapus menu '${menuName}'?`)) return;
    try {
      await apiRequest(`/api/v1/menus/${menuId}`, { method: 'DELETE' });
      loadData();
      refreshUserData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus menu');
    }
  }

  const parentOptions = allParents.filter((m) => !editingMenu || m.id !== editingMenu.id);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Manajemen Menu Sistem</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Konfigurasi hierarki menu sidebar, route path, icon, dan pengurutan dinamis
          </p>
        </div>

        <Can menu="/admin/menus" action="create">
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:from-amber-300 hover:to-orange-300 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Baru</span>
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
            placeholder="Cari nama menu, link path, icon..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Total: <strong className="text-white">{total}</strong> menu
        </span>
      </div>

      {/* Menus Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative">
        {/* Subtle top loading line when refreshing */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/20 overflow-hidden z-20">
            <div className="w-1/2 h-full bg-amber-400 animate-pulse"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          {menus.length === 0 && loading ? (
            <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span>Memuat konfigurasi menu...</span>
            </div>
          ) : menus.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              Tidak ada menu yang sesuai dengan kriteria pencarian.
            </div>
          ) : (
            <table className={`w-full text-left text-xs transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">Nama Menu</th>
                  <th className="py-3.5 px-5">Tipe Menu</th>
                  <th className="py-3.5 px-5">Parent (Induk)</th>
                  <th className="py-3.5 px-5">Icon</th>
                  <th className="py-3.5 px-5">Route Link</th>
                  <th className="py-3.5 px-5 text-center">Urutan</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {menus.map((m) => {
                  const parentObj = allParents.find((p) => p.id === m.parent_id);
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-5 font-mono text-slate-400">{m.id}</td>
                      <td className="py-3.5 px-5 font-bold text-white flex items-center gap-2">
                        {m.parent_id ? <span className="text-slate-600">↳</span> : null}
                        <span>{m.name}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        {m.is_parent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                            Folder / Group
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            Item Link
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-400">
                        {parentObj ? parentObj.name : <span className="text-slate-600">- (Top Level)</span>}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-amber-400">{m.icon || '-'}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-400">{m.link || '-'}</td>
                      <td className="py-3.5 px-5 text-center font-bold">{m.order_no}</td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Can menu="/admin/menus" action="update">
                            <button
                              type="button"
                              onClick={() => openEditModal(m)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                              title="Edit Menu"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </Can>

                          <Can menu="/admin/menus" action="delete">
                            <button
                              type="button"
                              onClick={() => handleDelete(m.id, m.name)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                              title="Hapus Menu"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </Can>
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

      {/* CREATE / EDIT MENU MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white">
              {editingMenu ? `Edit Menu: ${editingMenu.name}` : 'Tambah Menu Baru'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Menu baru akan langsung dimuat secara otomatis di sidebar sesuai perizinan role.
            </p>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Menu</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Kelola Diskon"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-4 py-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isParent}
                    onChange={(e) => setIsParent(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700"
                  />
                  <span className="font-semibold text-slate-300">Merupakan Menu Induk (Folder/Grup)</span>
                </label>
              </div>

              {!isParent && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Menu Induk (Parent)</label>
                    <select
                      value={parentId}
                      onChange={(e) => setParentId(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value={0}>Tidak Ada (Top-Level Menu)</option>
                      {parentOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Route Path (Link)</label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      placeholder="/admin/nama-halaman"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nama Icon Lucide</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="Menu"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Nomor Urutan</label>
                  <input
                    type="number"
                    value={orderNo}
                    onChange={(e) => setOrderNo(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
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
                  {submitting ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
