import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import Pagination from '../../components/common/Pagination';
import { BarChart3, RefreshCw, MapPin, Search } from 'lucide-react';

export default function AnalyticsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  async function loadLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await apiRequest(`/api/v1/stats/logs?${params.toString()}`);
      setLogs(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Gagal memuat log:', err);
    } finally {
      setLoading(false);
    }
  }

  // Unified fetch effect
  useEffect(() => {
    loadLogs();
  }, [page, limit, debouncedSearch]);

  function formatDateTimeLocal(isoStr) {
    if (!isoStr) return '-';
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium',
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
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Statistik & Log Scan Review</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Riwayat interaksi tap NFC dan scan QR pengunjung yang dialihkan ke Google Review
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode kartu, nama toko, alamat IP..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Total: <strong className="text-white">{total}</strong> kali scan tercatat
        </span>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl relative">
        {/* Subtle top loading line when refreshing */}
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/20 overflow-hidden z-20">
            <div className="w-1/2 h-full bg-amber-400 animate-pulse"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          {logs.length === 0 && loading ? (
            <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
              <span>Memuat data log scan...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              Belum ada riwayat scan yang cocok dengan pencarian.
            </div>
          ) : (
            <table className={`w-full text-left text-xs transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5">Kode Kartu</th>
                  <th className="py-3.5 px-5">Toko / Bisnis</th>
                  <th className="py-3.5 px-5">IP Pengunjung</th>
                  <th className="py-3.5 px-5">Perangkat (User Agent)</th>
                  <th className="py-3.5 px-5">Waktu Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-amber-400">{log.card_code}</td>
                    <td className="py-3.5 px-5 font-medium text-white">{log.business_name || 'Standee'}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-400">{log.ip_address || '127.0.0.1'}</td>
                    <td className="py-3.5 px-5 text-slate-400 truncate max-w-xs">{log.user_agent || 'Mobile Browser'}</td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">{formatDateTimeLocal(log.scanned_at)}</td>
                  </tr>
                ))}
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
    </div>
  );
}
