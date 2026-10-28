import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import CardsPage from './pages/admin/CardsPage';
import GeneratorPage from './pages/admin/GeneratorPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import UsersPage from './pages/admin/UsersPage';
import RolesPage from './pages/admin/RolesPage';
import MenusPage from './pages/admin/MenusPage';
import PermissionsPage from './pages/admin/PermissionsPage';
import ActivationView from './components/ActivationView';
import ScanSimulator from './components/ScanSimulator';
import { fetchHealth } from './services/api';
import { Star, ShieldAlert } from 'lucide-react';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/admin/dashboard');
  const [activeCardCode, setActiveCardCode] = useState('MMHBWS');
  const [serverStatus, setServerStatus] = useState('checking');

  // Monitor server health
  useEffect(() => {
    async function checkBackend() {
      const res = await fetchHealth();
      setServerStatus(res.status === 'healthy' ? 'healthy' : 'offline');
    }
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  // Parse path on initial load
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');

    if (codeParam) {
      setActiveCardCode(codeParam.toUpperCase());
      setCurrentPath('/activate');
    } else if (path.startsWith('/activate/')) {
      const codeFromPath = path.replace('/activate/', '').trim();
      if (codeFromPath) {
        setActiveCardCode(codeFromPath.toUpperCase());
        setCurrentPath('/activate');
      }
    } else if (path === '/simulator') {
      setCurrentPath('/simulator');
    } else if (path.startsWith('/admin')) {
      setCurrentPath(path);
    }
  }, []);

  function handleNavigate(path) {
    setCurrentPath(path);
    window.history.pushState(null, '', path);
  }

  // 1. Initial loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center animate-pulse">
          <Star className="w-6 h-6 fill-amber-400" />
        </div>
        <div className="text-sm font-medium">Memuat TapStar Review System...</div>
      </div>
    );
  }

  // 2. Public Activation Portal (Accessible directly from physical QR / NFC scan)
  if (currentPath === '/activate') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Navigation bar for public page */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <Star className="w-4 h-4 fill-slate-950" />
            </div>
            <span className="font-extrabold text-white tracking-tight">TapStar Activation Portal</span>
          </div>
          <button
            onClick={() => handleNavigate('/admin/dashboard')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Masuk Portal Admin →
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
          <ActivationView
            initialCode={activeCardCode}
            onCardActivated={(code) => setActiveCardCode(code)}
          />
        </main>
      </div>
    );
  }

  // 3. Public Interactive Simulator
  if (currentPath === '/simulator') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
              <Star className="w-4 h-4 fill-slate-950" />
            </div>
            <span className="font-extrabold text-white tracking-tight">TapStar NFC & QR Simulator</span>
          </div>
          <button
            onClick={() => handleNavigate('/admin/dashboard')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Kembali ke Admin Dashboard →
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6 flex items-center justify-center">
          <ScanSimulator
            onGoToActivate={(code) => {
              setActiveCardCode(code);
              handleNavigate('/activate');
            }}
          />
        </main>
      </div>
    );
  }

  // 4. Admin Authentication Check
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => handleNavigate('/admin/dashboard')} />;
  }

  // 5. Protected Admin Workspace with Dynamic Sidebar
  let pageTitle = 'Dashboard Ringkasan';
  if (currentPath === '/admin/cards') pageTitle = 'Manajemen Kartu & Barcode';
  if (currentPath === '/admin/generator') pageTitle = 'Batch Barcode Generator';
  if (currentPath === '/admin/analytics') pageTitle = 'Statistik & Log Scan';
  if (currentPath === '/admin/users') pageTitle = 'Manajemen Pengguna';
  if (currentPath === '/admin/roles') pageTitle = 'Role & Hak Akses (RBAC)';
  if (currentPath === '/admin/menus') pageTitle = 'Manajemen Menu Sistem';
  if (currentPath === '/admin/permissions') pageTitle = 'Kelola Izin (Permissions)';

  return (
    <AdminLayout
      currentPath={currentPath}
      onNavigate={handleNavigate}
      serverStatus={serverStatus}
      title={pageTitle}
    >
      {currentPath === '/admin/dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {currentPath === '/admin/cards' && <CardsPage onNavigate={handleNavigate} />}
      {currentPath === '/admin/generator' && <GeneratorPage onNavigate={handleNavigate} />}
      {currentPath === '/admin/analytics' && <AnalyticsPage />}
      {currentPath === '/admin/users' && <UsersPage />}
      {currentPath === '/admin/roles' && <RolesPage />}
      {currentPath === '/admin/menus' && <MenusPage />}
      {currentPath === '/admin/permissions' && <PermissionsPage />}
    </AdminLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
