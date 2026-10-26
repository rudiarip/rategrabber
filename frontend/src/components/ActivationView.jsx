import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  MapPin, 
  Star, 
  QrCode, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getCardInfo, searchPlaces, activateCard, API_BASE } from '../services/api';

export default function ActivationView({ initialCode = 'MMHBWS', onCardActivated }) {
  const [cardCode, setCardCode] = useState(initialCode);
  const [cardData, setCardData] = useState(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [cardError, setCardError] = useState(null);

  // Form states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Submission & UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const dropdownRef = useRef(null);

  // Fetch card status whenever cardCode changes
  useEffect(() => {
    if (!cardCode) return;
    loadCardDetails(cardCode);
  }, [cardCode]);

  async function loadCardDetails(code) {
    setLoadingCard(true);
    setCardError(null);
    setActivationSuccess(false);
    try {
      const data = await getCardInfo(code);
      setCardData(data);
      if (data.is_active) {
        setActivationSuccess(true);
        setSuccessInfo({
          business_name: data.business_name,
          review_url: data.review_url,
          place_id: data.place_id,
          total_scans: data.total_scans,
        });
      }
    } catch (err) {
      setCardError(err.message);
      setCardData(null);
    } finally {
      setLoadingCard(false);
    }
  }

  // Handle autocomplete search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchPlaces(searchQuery);
        setSearchResults(data.results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectPlace(place) {
    setSelectedPlace(place);
    setSearchQuery(place.name);
    setShowDropdown(false);
  }

  async function handleActivate(e) {
    e.preventDefault();
    if (!selectedPlace) {
      setSubmitError('Silakan cari dan pilih bisnis Google Maps terlebih dahulu.');
      return;
    }
    if (!pin || pin.length < 4) {
      setSubmitError('Kata Sandi / PIN minimal 4 karakter untuk melindungi pengaturan kartu Anda.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await activateCard(cardCode, {
        business_name: selectedPlace.name,
        business_address: selectedPlace.address,
        place_id: selectedPlace.place_id,
        pin: pin,
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setActivationSuccess(true);
      setSuccessInfo({
        business_name: selectedPlace.name,
        review_url: result.review_url,
        place_id: selectedPlace.place_id,
        total_scans: 0
      });

      if (onCardActivated) {
        onCardActivated(cardCode);
      }
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="activation-wrapper">
      {/* Switcher Bar for testing different card codes easily */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.6rem 1rem',
        marginBottom: '1.25rem',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
          <Sliders size={15} />
          <span>Simulasi Kode Kartu:</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <input
            type="text"
            value={cardCode}
            onChange={(e) => setCardCode(e.target.value.toUpperCase())}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#38bdf8',
              fontWeight: '700',
              padding: '0.25rem 0.6rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              width: '110px',
              textAlign: 'center'
            }}
          />
          <button
            onClick={() => loadCardDetails(cardCode)}
            style={{
              background: '#2563eb',
              border: 'none',
              color: 'white',
              borderRadius: '6px',
              padding: '0.25rem 0.6rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Refresh info kartu"
          >
            <RefreshCw size={13} className={loadingCard ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Smartphone Screen Mockup */}
      <div className="phone-mockup">
        <div className="phone-speaker-notch"></div>

        {loadingCard ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <div style={{ display: 'inline-block', color: '#2563eb' }}>
              <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
            <p style={{ marginTop: '0.75rem', color: '#64748b', fontSize: '0.9rem' }}>Memuat status kartu...</p>
          </div>
        ) : cardError ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: 800 }}>Kartu Belum Terdaftar</h3>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
              Kode <strong>{cardCode}</strong> tidak ditemukan di database. Pastikan kartu telah di-generate melalui Dashboard Admin.
            </p>
          </div>
        ) : activationSuccess ? (
          /* Success Screen for Activated Card */
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#ecfdf5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              border: '2px solid #a7f3d0'
            }}>
              <CheckCircle2 size={36} color="#059669" />
            </div>

            <div className="badge-card-code" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#059669' }}>
              KARTU AKTIF: {cardCode}
            </div>

            <h2 className="phone-title" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
              Siap Digunakan!
            </h2>
            <p className="phone-subtitle" style={{ marginBottom: '1.5rem' }}>
              Kartu ini telah terhubung ke profil Google Maps <strong>{successInfo?.business_name}</strong>.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '1.1rem',
              textAlign: 'left',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a', fontWeight: '700', fontSize: '0.95rem' }}>
                <Building2 size={16} color="#2563eb" />
                <span>{successInfo?.business_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <div className="stars-rating">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: '4px' }}>Google Reviews</span>
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                <strong>Total Scan Pelanggan:</strong> {successInfo?.total_scans || 0} kali
              </div>
            </div>

            {/* Direct action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a
                href={`${API_BASE}/c/${cardCode}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#2563eb',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '700',
                  fontSize: '0.92rem'
                }}
              >
                <ExternalLink size={16} />
                <span>Tes Tap NFC / Buka Link Review</span>
              </a>

              <a
                href={`${API_BASE}/api/cards/${cardCode}/qr`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  background: '#f1f5f9',
                  color: '#334155',
                  textDecoration: 'none',
                  padding: '0.8rem',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '600',
                  fontSize: '0.88rem'
                }}
              >
                <QrCode size={16} />
                <span>Lihat QR Code Kartu</span>
              </a>
            </div>
          </div>
        ) : (
          /* Activation Form (Exact flow from prompt screenshot) */
          <div>
            <div className="badge-card-code">
              Kode kartu: {cardCode}
            </div>

            <h1 className="phone-title">Aktivasi Kartu</h1>
            <p className="phone-subtitle">
              Isi semua kolom di bawah untuk mengaktifkan kartu ini ke profil bisnis Google Maps Anda.
            </p>

            <form onSubmit={handleActivate}>
              {/* Field 1: Nama Bisnis with Autocomplete */}
              <div className="form-group" ref={dropdownRef}>
                <label className="form-label" htmlFor="business-search-input">Nama Bisnis</label>
                <div className="input-container">
                  <Building2 size={18} className="input-icon" />
                  <input
                    id="business-search-input"
                    type="text"
                    className="phone-input"
                    placeholder="Ketik nama cafe, resto, atau toko..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true);
                    }}
                    autoComplete="off"
                    required
                  />
                  {isSearching && (
                    <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                      <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
                    </div>
                  )}
                </div>

                {/* Autocomplete Dropdown List matching post mockup */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {searchResults.map((place) => (
                      <div
                        key={place.place_id}
                        className={`autocomplete-item ${selectedPlace?.place_id === place.place_id ? 'selected' : ''}`}
                        onClick={() => handleSelectPlace(place)}
                      >
                        <MapPin size={17} color="#2563eb" style={{ marginTop: '2px', flexShrink: 0 }} />
                        <div>
                          <div className="place-item-name">{place.name}</div>
                          <div className="place-item-address">{place.address}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Place Confirmation Badge */}
                {selectedPlace && (
                  <div className="selected-place-card">
                    <div className="selected-place-info">
                      <CheckCircle2 size={18} color="#059669" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065f46' }}>
                          {selectedPlace.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                          Terhubung ke Google Maps
                        </div>
                      </div>
                    </div>
                    <div className="stars-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 2: Kata Sandi / PIN */}
              <div className="form-group">
                <label className="form-label" htmlFor="card-pin-input">
                  Kata Sandi / PIN Pengaman
                </label>
                <div className="input-container">
                  <Lock size={18} className="input-icon" />
                  <input
                    id="card-pin-input"
                    type={showPin ? 'text' : 'password'}
                    className="phone-input"
                    placeholder="Buat 4-6 digit PIN kartu..."
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    style={{
                      position: 'absolute',
                      right: '0.85rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94a3b8'
                    }}
                  >
                    {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                  *PIN ini berguna jika Anda ingin mengganti nama bisnis atau melihat statistik scan nanti.
                </div>
              </div>

              {submitError && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <AlertCircle size={15} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-activate"
                disabled={isSubmitting || !selectedPlace || !pin}
                id="submit-activate-btn"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Mengaktifkan Kartu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Aktifkan Kartu Sekarang</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
