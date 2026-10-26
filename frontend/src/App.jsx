import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ActivationView from './components/ActivationView';
import AdminDashboard from './components/AdminDashboard';
import ScanSimulator from './components/ScanSimulator';
import { fetchHealth } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('activate');
  const [activeCardCode, setActiveCardCode] = useState('MMHBWS');
  const [serverStatus, setServerStatus] = useState('checking');

  // Check backend server status
  useEffect(() => {
    async function checkBackend() {
      const res = await fetchHealth();
      setServerStatus(res.status === 'healthy' ? 'healthy' : 'offline');
    }
    checkBackend();
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  // Parse path or search parameters if user opens direct link e.g. /activate/MMHBWS
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');

    if (codeParam) {
      setActiveCardCode(codeParam.toUpperCase());
      setActiveTab('activate');
    } else if (path.startsWith('/activate/')) {
      const codeFromPath = path.replace('/activate/', '').trim();
      if (codeFromPath) {
        setActiveCardCode(codeFromPath.toUpperCase());
        setActiveTab('activate');
      }
    } else if (path === '/admin') {
      setActiveTab('admin');
    }
  }, []);

  function handleSelectCardForActivation(code) {
    setActiveCardCode(code);
    setActiveTab('activate');
  }

  return (
    <div className="min-h-screen">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverStatus={serverStatus}
      />

      <main>
        {activeTab === 'activate' && (
          <ActivationView
            initialCode={activeCardCode}
            onCardActivated={(code) => setActiveCardCode(code)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            onSelectCardForActivation={handleSelectCardForActivation}
          />
        )}

        {activeTab === 'simulator' && (
          <ScanSimulator
            onGoToActivate={(code) => {
              setActiveCardCode(code);
              setActiveTab('activate');
            }}
          />
        )}
      </main>
    </div>
  );
}
