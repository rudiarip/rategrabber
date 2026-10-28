import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../api/client';
import Can from '../../components/common/Can';
import { 
  CreditCard, 
  CheckCircle2, 
  BarChart3, 
  Percent, 
  Layers, 
  ArrowUpRight, 
  Clock, 
  MapPin, 
  Smartphone,
  ExternalLink 
} from 'lucide-react';

export default function DashboardPage({ onNavigate }) {
  const [stats, setStats] = useState({
    total_cards: 0,
    active_cards: 0,
    inactive_cards: 0,
    total_scans: 0,
    recent_scans: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiRequest('/api/v1/stats/dashboard');
        setStats(data);
      } catch (err) {
        console.error('Gagal memuat statistik dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const activationRate = stats.total_cards > 0 
    ? Math.round((stats.active_cards / stats.total_cards) * 100) 
    : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-900 border border-amber-500/20 p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold mb-3 border border-amber-500/30">
            <span>⭐ TapStar System Active</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Ringkasan & Aktivitas Kartu Review
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Pantau performa kartu NFC dan QR akrilik secara langsung. Seluruh ulasan diarahkan ke formulir bintang 5 Google Maps.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          <Can menu="/admin/generator" action="create">
            <button
              type="button"
              onClick={() => onNavigate('/admin/generator')}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:from-amber-300 hover:to-orange-300 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Layers className="w-4 h-4" />
              <span>Generate Batch Barcode</span>
            </button>
          </Can>

          <button
            type="button"
            onClick={() => onNavigate('/simulator')}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Buka Simulator NFC</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cards */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Kartu Dibuat</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{loading ? '...' : stats.total_cards}</div>
          <div className="text-[11px] text-slate-400 mt-1">Dicetak massal / standee</div>
        </div>

        {/* Active Cards */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Kartu Telah Aktif</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{loading ? '...' : stats.active_cards}</div>
          <div className="text-[11px] text-emerald-400 mt-1">Terhubung ke Google Maps</div>
        </div>

        {/* Total Scans */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Tap & Scan</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{loading ? '...' : stats.total_scans}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pengunjung diarahkan ke ulasan</div>
        </div>

        {/* Activation Rate */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tingkat Aktivasi</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3">{loading ? '...' : `${activationRate}%`}</div>
          <div className="text-[11px] text-slate-400 mt-1">{stats.inactive_cards} kartu belum diaktifkan</div>
        </div>
      </div>

      {/* Recent Scans Activity Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Aktivitas Scan Terbaru</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat interaksi pelanggan tap NFC atau scan QR ulasan</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/admin/cards')}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>Lihat Semua Kartu</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {stats.recent_scans.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Belum ada aktivitas scan ulasan. Gunakan simulator untuk menguji!
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-5">Kode Kartu</th>
                  <th className="py-3 px-5">Nama Tempat / Bisnis</th>
                  <th className="py-3 px-5">Alamat IP</th>
                  <th className="py-3 px-5">Waktu Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {stats.recent_scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-amber-400">
                      {scan.card_code}
                    </td>
                    <td className="py-3.5 px-5 font-medium text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{scan.business_name || 'Belum Diaktifkan'}</span>
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-400">
                      {scan.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px]">
                      {scan.scanned_at ? new Date(scan.scanned_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }) + ' WIB' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
