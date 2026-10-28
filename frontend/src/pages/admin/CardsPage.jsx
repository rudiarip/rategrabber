import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import Can from '../../components/common/Can';
import Pagination from '../../components/common/Pagination';
import { 
  Search, 
  QrCode, 
  Download, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  Plus, 
  Copy, 
  Check, 
  RefreshCw,
  MapPin,
  X,
  Layers
} from 'lucide-react';

export default function CardsPage({ onNavigate }) {
  const [cards, setCards] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'active', 'inactive'
  
  // Modals state
  const [previewCard, setPreviewCard] = useState(null);
  const [editCard, setEditCard] = useState(null);
  const [singleModal, setSingleModal] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Debounce search input only (does not re-trigger on initial mount with empty string)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 2. Reset page when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // 3. Single unified data loader
  async function loadCards() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const data = await apiRequest(`/api/v1/cards?${params.toString()}`);
      setCards(data.items || data.cards || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error('Gagal memuat kartu:', err);
    } finally {
      setLoading(false);
    }
  }

  // Unified effect to fetch cards
  useEffect(() => {
    loadCards();
  }, [page, limit, statusFilter, debouncedSearch]);

  async function handleCreateSingle(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await apiRequest('/api/v1/cards', {
        method: 'POST',
        body: JSON.stringify({ custom_code: customCode || null }),
      });
      setSingleModal(false);
      setCustomCode('');
      loadCards();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal membuat kartu');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(code) {
    if (!window.confirm(`Yakin ingin menghapus kartu ${code}? Data scan akan ikut terhapus.`)) return;
    try {
      await apiRequest(`/api/v1/cards/${code}`, { method: 'DELETE' });
      loadCards();
    } catch (err) {
      alert(err.message || 'Gagal menghapus kartu');
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest(`/api/v1/cards/${editCard.code}`, {
        method: 'PUT',
        body: JSON.stringify({
          business_name: editCard.business_name,
          business_address: editCard.business_address,
          review_url: editCard.review_url,
          new_pin: editCard.new_pin || null,
        }),
      });
      setEditCard(null);
      loadCards();
    } catch (err) {
      alert(err.message || 'Gagal update kartu');
    } finally {
      setSubmitting(false);
    }
  }

  function copyToClipboard(text, code) {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Manajemen Kartu & Barcode</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola kartu fisik, unduh file QR resolusi tinggi, dan pantau status aktivasi Google Maps
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Can menu="/admin/cards" action="create">
            <button
              type="button"
              onClick={() => setSingleModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Kartu Tunggal</span>
            </button>
          </Can>

          <Can menu="/admin/generator" action="create">
            <button
              type="button"
              onClick={() => onNavigate('/admin/generator')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:from-amber-300 hover:to-orange-300 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Batch Generator</span>
            </button>
          </Can>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search input with debouncing */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode (MMHBWS), nama toko, batch..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setStatusFilter(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === '' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua ({total})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('active'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'active' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Aktif
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('inactive'); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === 'inactive' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Belum Aktif
          </button>
        </div>
      </div>

      {/* Cards Table Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative">
        {/* Subtle top loading line when refreshing */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/20 overflow-hidden z-20">
            <div className="w-1/2 h-full bg-amber-400 animate-pulse"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          {cards.length === 0 && loading ? (
            <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span>Memuat daftar kartu...</span>
            </div>
          ) : cards.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              Tidak ada kartu yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            <table className={`w-full text-left text-xs transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Kode / QR</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Bisnis Terhubung</th>
                  <th className="py-3.5 px-5">Waktu Aktivasi</th>
                  <th className="py-3.5 px-5 text-center">Total Scan</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Code & QR Preview thumbnail */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPreviewCard(card)}
                          title="Lihat QR Code"
                          className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center border border-slate-700 hover:border-amber-400 transition-all flex-shrink-0"
                        >
                          <img src={card.qr_png_url} alt={card.code} className="w-full h-full object-contain" />
                        </button>
                        <div>
                          <div className="font-mono font-bold text-amber-400 text-sm tracking-wider">
                            {card.code}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span>{card.target_scan_url}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(card.target_scan_url, card.code)}
                              className="text-slate-400 hover:text-white"
                              title="Salin Link Direct"
                            >
                              {copiedCode === card.code ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5">
                      {card.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Aktif (Live)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Belum Aktif
                        </span>
                      )}
                    </td>

                    {/* Business Details */}
                    <td className="py-3.5 px-5">
                      {card.is_active ? (
                        <div>
                          <div className="font-semibold text-white">{card.business_name}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{card.business_address || '-'}</div>
                          {card.review_url && (
                            <a
                              href={card.review_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-amber-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              <span>Buka Google Review</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">Menunggu aktivasi scan</span>
                      )}
                    </td>

                    {/* Activated At (+07:00) */}
                    <td className="py-3.5 px-5 text-slate-400 text-[11px] font-mono">
                      {card.is_active ? formatDateTimeLocal(card.activated_at) : '-'}
                    </td>

                    {/* Total Scans */}
                    <td className="py-3.5 px-5 text-center font-bold text-sm text-white">
                      {card.total_scans}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewCard(card)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Preview & Download QR"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        <Can menu="/admin/cards" action="update">
                          <button
                            type="button"
                            onClick={() => setEditCard({ ...card })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                            title="Edit Kartu / Reset PIN"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </Can>

                        <Can menu="/admin/cards" action="delete">
                          <button
                            type="button"
                            onClick={() => handleDelete(card.code)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
                            title="Hapus Kartu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Lightweight Responsive Pagination */}
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

      {/* QR PREVIEW MODAL */}
      {previewCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 text-center relative shadow-2xl">
            <button
              onClick={() => setPreviewCard(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="font-extrabold text-white text-lg tracking-tight">QR Code Kartu TapStar</div>
            <div className="font-mono text-xs font-bold text-amber-400 mt-0.5">KODE: {previewCard.code}</div>

            {/* QR Visual */}
            <div className="my-5 p-4 bg-white rounded-2xl shadow-inner inline-block">
              <img src={previewCard.qr_png_url} alt={previewCard.code} className="w-48 h-48 object-contain" />
            </div>

            <div className="text-[11px] text-slate-400 mb-5 break-all font-mono bg-slate-950 p-2 rounded-xl border border-slate-800">
              {previewCard.target_scan_url}
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={previewCard.qr_png_url}
                download={`TapStar_${previewCard.code}.png`}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </a>
              <a
                href={previewCard.qr_svg_url}
                download={`TapStar_${previewCard.code}.svg`}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:from-amber-300 hover:to-orange-300 flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Vector SVG</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SINGLE CARD MODAL */}
      {singleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setSingleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white">Buat Kartu Baru</h3>
            <p className="text-xs text-slate-400 mt-1">Kartu baru akan otomatis berstatus belum aktif dan siap dicetak.</p>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateSingle} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Kode Kustom (Opsional)
                </label>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="Kosongkan untuk kode otomatis 6 huruf"
                  maxLength={16}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Membuat...' : 'Buat Kartu Sekarang'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CARD MODAL */}
      {editCard && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setEditCard(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white">Edit Kartu {editCard.code}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ubah nama bisnis, tautan review, atau perbarui PIN pengaman.</p>

            <form onSubmit={handleUpdate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Nama Tempat / Bisnis</label>
                <input
                  type="text"
                  value={editCard.business_name || ''}
                  onChange={(e) => setEditCard({ ...editCard, business_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Alamat Bisnis</label>
                <input
                  type="text"
                  value={editCard.business_address || ''}
                  onChange={(e) => setEditCard({ ...editCard, business_address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Review URL (Google Maps Direct)</label>
                <input
                  type="text"
                  value={editCard.review_url || ''}
                  onChange={(e) => setEditCard({ ...editCard, review_url: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Reset PIN Baru (Opsional)</label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah PIN"
                  value={editCard.new_pin || ''}
                  onChange={(e) => setEditCard({ ...editCard, new_pin: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditCard(null)}
                  className="px-4 py-2 rounded-xl font-medium text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50"
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
