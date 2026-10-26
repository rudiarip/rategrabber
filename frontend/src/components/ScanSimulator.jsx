import React, { useState } from 'react';
import { Radio, Smartphone, QrCode, ArrowRight, ExternalLink, CheckCircle2, AlertTriangle, Play } from 'lucide-react';
import { API_BASE, getCardInfo } from '../services/api';

export default function ScanSimulator({ onGoToActivate }) {
  const [testCode, setTestCode] = useState('MMHBWS');
  const [simState, setSimState] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSimulate() {
    if (!testCode.trim()) return;
    setLoading(true);
    setSimState(null);
    try {
      const data = await getCardInfo(testCode);
      setSimState({
        card: data,
        action: data.is_active ? 'redirect_google' : 'redirect_activation',
        targetUrl: data.is_active 
          ? data.review_url 
          : `${window.location.origin}/activate/${data.code}`
      });
    } catch (err) {
      setSimState({
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: '680px', margin: '2.5rem auto', padding: '0 1rem' }}>
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(66, 133, 244, 0.15)',
            color: 'var(--google-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Radio size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Simulator Tap NFC / Scan QR</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Uji coba alur kerja kartu secara nyata saat disentuhkan ke HP atau di-scan dengan kamera.
            </p>
          </div>
        </div>

        {/* Input Code */}
        <div style={{ margin: '1.5rem 0' }}>
          <label className="form-label" style={{ color: 'var(--text-main)' }}>
            Masukkan Kode Kartu Yang Ingin Di-test:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              placeholder="Contoh: MMHBWS"
              className="dash-input"
              style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em' }}
            />
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="btn-primary-gradient"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Play size={16} />
              <span>{loading ? 'Mengecek...' : 'Simulasikan Scan'}</span>
            </button>
          </div>
        </div>

        {/* Simulation Result Box */}
        {simState && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            animation: 'modalPop 0.25s ease'
          }}>
            {simState.error ? (
              <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} />
                <span>{simState.error}</span>
              </div>
            ) : simState.action === 'redirect_activation' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={18} />
                  <span>KARTU BELUM DIAKTIFKAN (Scan Pertama Kali)</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  Karena kartu <strong>{simState.card.code}</strong> baru pertama kali di-scan oleh pembeli, sistem langsung mengarahkannya ke halaman aktivasi untuk memilih bisnis Google Maps dan membuat PIN.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => onGoToActivate(simState.card.code)}
                    className="btn-primary-gradient"
                    style={{ fontSize: '0.9rem' }}
                  >
                    <span>Lanjutkan ke Halaman Aktivasi</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={18} />
                  <span>KARTU SUDAH AKTIF (Pelanggan Cafe Scan)</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  Kartu ini terdaftar atas nama <strong>{simState.card.business_name}</strong>.
                  Sistem otomatis mencatat <strong>+1 Scan Counter</strong> dan langsung melakukan <strong>HTTP 302 Redirect</strong> menuju formulir review Google Maps bintang 5!
                </p>

                <div style={{
                  background: 'rgba(2, 6, 23, 0.6)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #334155',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>URL Tujuan Akhir (Direct Review):</div>
                  <div style={{ fontSize: '0.85rem', color: '#38bdf8', wordBreak: 'break-all', marginTop: '3px' }}>
                    {simState.card.review_url}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Real scan trigger */}
                  <a
                    href={`${API_BASE}/c/${simState.card.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary-gradient"
                    style={{ textDecoration: 'none', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                  >
                    <ExternalLink size={16} />
                    <span>Buka URL Scan Langsung ({`${API_BASE}/c/${simState.card.code}`})</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Informative Step by Step Card */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            Cara Kerja Sistem di Lapangan:
          </h4>
          <ol style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li><strong>Admin Cetak:</strong> Admin mencetak standee/kartu dengan URL <code>domain.com/c/MMHBWS</code> ke QR code & chip NFC.</li>
            <li><strong>Pembeli Aktivasi:</strong> Pemilik cafe tap kartu pertama kali -&gt; Muncul form pilih bisnis via Google Maps &amp; PIN.</li>
            <li><strong>Pelanggan Review:</strong> Pengunjung cafe tap kartu -&gt; Langsung lompat <em>(302 Redirect)</em> ke formulir rating Google Review.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
