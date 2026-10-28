import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  PlusCircle, 
  Download, 
  Search, 
  RotateCcw, 
  Trash2, 
  QrCode, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { 
  fetchAdminOverview, 
  fetchAdminCards, 
  generateBatchCards, 
  resetCard, 
  deleteCard, 
  API_BASE 
} from '../services/api';

export default function AdminDashboard({ onSelectCardForActivation }) {
  const [stats, setStats] = useState({
    total_cards: 0,
    active_cards: 0,
    inactive_cards: 0,
    total_scans: 0,
    recent_scans: []
  });

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Batch generator state
  const [batchCount, setBatchCount] = useState(10);
  const [batchPrefix, setBatchPrefix] = useState('');
  const [batchName, setBatchName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestBatch, setLatestBatch] = useState(null);

  // Active QR Modal
  const [qrModalCard, setQrModalCard] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    loadOverview();
    loadCards();
  }, [filterStatus]);

  async function loadOverview() {
    try {
      const data = await fetchAdminOverview();
      setStats(data);
    } catch (err) {
      console.error('Error fetching admin overview:', err);
    }
  }

  async function loadCards() {
    setLoading(true);
    try {
      const data = await fetchAdminCards({
        status: filterStatus || undefined,
        search: searchTerm || undefined,
        limit: 100
      });
      setCards(data.cards || []);
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateBatch(e) {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const result = await generateBatchCards({
        count: batchCount,
        prefix: batchPrefix,
        batch_name: batchName || undefined
      });
      setLatestBatch(result);
      loadOverview();
      loadCards();
    } catch (err) {
      alert(`Gagal generate kartu: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleReset(card) {
    if (!window.confirm(`Yakin ingin mereset kartu ${card.code}? Kartu akan kembali ke status unactivated.`)) return;
    try {
      await resetCard(card.id);
      loadOverview();
      loadCards();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  async function handleDelete(card) {
    if (!window.confirm(`Hapus permanen kartu ${card.code}?`)) return;
    try {
      await deleteCard(card.id);
      loadOverview();
      loadCards();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  function handleCopyUrl(card) {
    const url = card.direct_url || `${API_BASE}/c/${card.code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(card.code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="dashboard-container">
      {/* 4 KPI Stats Grid */}
      <div className="stats-grid">
        <div className="glass-panel stat-card blue">
          <div>
            <div className="stat-label">Total Kartu Terdaftar</div>
            <div className="stat-value">{stats.total_cards}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--google-blue)' }}>
            <CreditCard size={26} />
          </div>
        </div>

        <div className="glass-panel stat-card green">
          <div>
            <div className="stat-label">Kartu Aktif (Toko)</div>
            <div className="stat-value">{stats.active_cards}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--google-green)' }}>
            <CheckCircle size={26} />
          </div>
        </div>

        <div className="glass-panel stat-card yellow">
          <div>
            <div className="stat-label">Kartu Belum Aktif (Stok)</div>
            <div className="stat-value">{stats.inactive_cards}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--google-yellow)' }}>
            <Clock size={26} />
          </div>
        </div>

        <div className="glass-panel stat-card purple">
          <div>
            <div className="stat-label">Total Scan Review</div>
            <div className="stat-value">{stats.total_scans}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: 'var(--accent-purple)' }}>
            <BarChart3 size={26} />
          </div>
        </div>
      </div>

      {/* Batch Generator Section */}
      <div className="glass-panel batch-generator-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
              ⚡ Generator Kartu Massal (Cetak & NFC)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              Generate kode unik kartu secara massal, otomatis unduh file QR gambar tajam (PNG/SVG) dan file CSV untuk mesin NFC Writer.
            </p>
          </div>

          {latestBatch && (
            <a
              href={`${API_BASE}/api/admin/cards/download-batch/${latestBatch.batch_id}`}
              className="btn-primary-gradient"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', textDecoration: 'none' }}
            >
              <Download size={17} />
              <span>Unduh ZIP Batch ({latestBatch.count} Kartu)</span>
            </a>
          )}
        </div>

        <form onSubmit={handleGenerateBatch} className="batch-controls">
          <div>
            <label className="form-label" style={{ color: 'var(--text-muted)' }}>Jumlah Kartu</label>
            <input
              type="number"
              min="1"
              max="500"
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
              className="dash-input"
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ color: 'var(--text-muted)' }}>Prefix Kode (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: KAFE"
              maxLength="5"
              value={batchPrefix}
              onChange={(e) => setBatchPrefix(e.target.value.toUpperCase())}
              className="dash-input"
            />
          </div>

          <div>
            <label className="form-label" style={{ color: 'var(--text-muted)' }}>Nama Batch</label>
            <input
              type="text"
              placeholder="Contoh: Cetak-Standee-01"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="dash-input"
            />
          </div>

          <button
            type="submit"
            className="btn-primary-gradient"
            disabled={isGenerating}
            id="btn-generate-batch"
          >
            <PlusCircle size={18} />
            <span>{isGenerating ? 'Generating...' : 'Buat Kartu Baru'}</span>
          </button>
        </form>
      </div>

      {/* Cards Explorer & Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Daftar Kartu Terdaftar ({cards.length})</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Klik pada kartu untuk aktivasi langsung atau unduh QR code untuk dicetak.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
              <input
                type="text"
                placeholder="Cari kode atau toko..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadCards()}
                className="dash-input"
                style={{ paddingLeft: '2.2rem', width: '210px' }}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="dash-input"
              style={{ width: '150px' }}
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Belum Aktif</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Kode Kartu</th>
                <th>Status</th>
                <th>Nama Bisnis</th>
                <th>Batch ID</th>
                <th>Scan Counter</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Memuat data kartu...
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Belum ada kartu di database. Gunakan tombol "Buat Kartu Baru" di atas untuk generate kartu perdana.
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: '#38bdf8' }}>
                          {card.code}
                        </strong>
                        <button
                          onClick={() => handleCopyUrl(card)}
                          className="btn-icon"
                          title="Copy Scan URL"
                          style={{ width: '26px', height: '26px' }}
                        >
                          {copiedCode === card.code ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </td>

                    <td>
                      {card.is_active ? (
                        <span className="status-badge status-active">
                          <CheckCircle size={12} />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="status-badge status-inactive">
                          <Clock size={12} />
                          <span>Belum Aktif</span>
                        </span>
                      )}
                    </td>

                    <td>
                      {card.business_name ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{card.business_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                            {card.business_address || 'Google Review Destination'}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => onSelectCardForActivation(card.code)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--google-blue)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: 0,
                            textDecoration: 'underline'
                          }}
                        >
                          Aktivasi Kartu Ini
                        </button>
                      )}
                    </td>

                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {card.batch_id || '-'}
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, color: card.total_scans > 0 ? '#34d399' : 'inherit' }}>
                        {card.total_scans}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => setQrModalCard(card)}
                          className="btn-icon"
                          title="Lihat QR Code"
                        >
                          <QrCode size={15} />
                        </button>

                        <a
                          href={`${API_BASE}/c/${card.code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-icon"
                          title="Buka / Tes Redirect URL"
                        >
                          <ExternalLink size={15} />
                        </a>

                        {card.is_active && (
                          <button
                            onClick={() => handleReset(card)}
                            className="btn-icon"
                            title="Reset Kartu ke Belum Aktif"
                            style={{ color: '#fbbf24' }}
                          >
                            <RotateCcw size={15} />
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(card)}
                          className="btn-icon"
                          title="Hapus Kartu"
                          style={{ color: '#f87171' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalCard && (
        <div className="modal-overlay" onClick={() => setQrModalCard(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ textAlign: 'left' }}>
                <span className="badge-card-code" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
                  KODE: {qrModalCard.code}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px' }}>
                  {qrModalCard.business_name || 'Kartu Belum Teraktivasi'}
                </h3>
              </div>
              <button
                onClick={() => setQrModalCard(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            {/* QR Code Image Preview */}
            <div style={{
              background: '#ffffff',
              padding: '1.25rem',
              borderRadius: '16px',
              border: '2px solid #e2e8f0',
              display: 'inline-block',
              margin: '0.75rem 0'
            }}>
              <img
                src={`${API_BASE}/api/cards/${qrModalCard.code}/qr`}
                alt={`QR Code ${qrModalCard.code}`}
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b', wordBreak: 'break-all', marginBottom: '1.25rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '8px' }}>
              <strong>URL Target:</strong> {`${API_BASE}/c/${qrModalCard.code}`}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href={`${API_BASE}/api/cards/${qrModalCard.code}/qr`}
                download={`QR_${qrModalCard.code}.png`}
                className="btn-activate"
                style={{ marginTop: 0, textDecoration: 'none' }}
              >
                <Download size={16} />
                <span>Unduh Gambar PNG</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
