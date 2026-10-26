import React from 'react';
import { Smartphone, LayoutDashboard, Radio, Sparkles, ExternalLink } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, serverStatus }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-brand">
          <div className="google-dots">
            <span className="google-dot dot-blue"></span>
            <span className="google-dot dot-red"></span>
            <span className="google-dot dot-yellow"></span>
            <span className="google-dot dot-green"></span>
          </div>
          <span>RateGrabber</span>
          <span style={{ 
            fontSize: '0.72rem', 
            fontWeight: 600, 
            background: 'rgba(66, 133, 244, 0.15)', 
            color: '#60a5fa', 
            padding: '2px 8px', 
            borderRadius: '99px',
            border: '1px solid rgba(96, 165, 250, 0.3)'
          }}>
            NFC & QR Review
          </span>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'activate' ? 'active' : ''}`}
            onClick={() => setActiveTab('activate')}
            id="tab-activate-btn"
          >
            <Smartphone size={16} />
            <span>Aktivasi Kartu</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
            id="tab-admin-btn"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard Admin</span>
          </button>

          <button
            className={`nav-tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
            onClick={() => setActiveTab('simulator')}
            id="tab-simulator-btn"
          >
            <Radio size={16} />
            <span>Test Tap NFC / Scan</span>
          </button>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            fontSize: '0.8rem',
            color: serverStatus === 'healthy' ? '#34d399' : '#f87171'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: serverStatus === 'healthy' ? '#10b981' : '#ef4444',
              boxShadow: serverStatus === 'healthy' ? '0 0 8px #10b981' : 'none'
            }}></span>
            <span>{serverStatus === 'healthy' ? 'Backend Online' : 'Connecting...'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
