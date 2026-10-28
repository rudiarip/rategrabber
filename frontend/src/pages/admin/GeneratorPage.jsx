import React, { useState } from 'react';
import { apiRequest, getToken } from '../../api/client';
import { Layers, Download, CheckCircle2, AlertCircle, FileArchive, ArrowRight } from 'lucide-react';

export default function GeneratorPage({ onNavigate }) {
  const [count, setCount] = useState(25);
  const [batchName, setBatchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await apiRequest('/api/v1/cards/batch', {
        method: 'POST',
        body: JSON.stringify({
          count: Number(count),
          batch_name: batchName.trim() || undefined,
        }),
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Gagal generate kartu massal');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadZip() {
    if (!result?.batch_id) return;
    setDownloading(true);
    try {
      const token = getToken();
      const downloadEndpoint = `/api/v1/cards/batch/${result.batch_id}/zip`;
      const res = await fetch(downloadEndpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Gagal unduh file (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TapStar_${result.batch_id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message || 'Gagal mengunduh file ZIP');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Batch Barcode & QR Generator</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate ratusan kartu ulasan sekaligus dalam 1 klik dan unduh paket siap cetak untuk percetakan standee akrilik & chip NFC.
        </p>
      </div>

      {/* Main Generator Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Count Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Jumlah Kartu yang Ingin Dibuat
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[10, 25, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCount(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      count === num
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {num} Pcs
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                placeholder="Atau ketik jumlah manual (1 - 500)"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Maksimal 500 kartu per batch</span>
            </div>

            {/* Batch Name Identifier */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Nama Label Batch (Opsional)
              </label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Contoh: CETAK_STAND_DESEMBER_2026"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 uppercase font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Digunakan untuk membedakan pesanan percetakan akrilik
              </span>
            </div>
          </div>

          {/* Package Description Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="font-semibold text-white">🖼️ Folder PNG 300 DPI</div>
              <div className="text-[11px] text-slate-400 mt-1">Resolusi tinggi untuk cetak UV flatbed langsung ke akrilik.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="font-semibold text-white">📐 Vector SVG</div>
              <div className="text-[11px] text-slate-400 mt-1">Format kurva untuk CorelDraw, Illustrator & Laser Engraving.</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="font-semibold text-white">📡 CSV NFC Encoding</div>
              <div className="text-[11px] text-slate-400 mt-1">File CSV siap import ke NFC Tools Pro atau desktop writer.</div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-slate-950 hover:from-amber-300 hover:to-orange-400 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Sedang Mengenerate {count} Kartu...</span>
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                <span>Generate & Buat Paket ZIP ({count} Kartu)</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Generated Result Callout */}
      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-white">
                Berhasil Membuat {result.total_generated} Kartu Baru!
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Batch ID: <span className="font-mono text-amber-400 font-bold">{result.batch_id}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Paket ZIP berisi file QR resolusi tinggi (PNG), Vector (SVG), dan file CSV URL untuk alat NFC Writer siap diunduh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={downloading}
              className="w-full md:w-auto px-5 py-3 rounded-xl font-bold text-xs bg-emerald-400 text-slate-950 hover:bg-emerald-300 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengunduh ZIP...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh File ZIP Sekarang</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/admin/cards')}
              className="px-4 py-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
            >
              Buka Daftar Kartu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
