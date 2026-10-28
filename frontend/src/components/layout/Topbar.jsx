import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Activity, User, Shield } from 'lucide-react';

export default function Topbar({ serverStatus = 'healthy', title = 'Dashboard' }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
          Admin Portal
        </span>
      </div>

      {/* Right Tools & User Info */}
      <div className="flex items-center gap-4">
        {/* Backend Server Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className={`w-2 h-2 rounded-full ${serverStatus === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
          <span className="text-slate-300 font-medium capitalize">
            {serverStatus === 'healthy' ? 'Backend Online' : 'Offline'}
          </span>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="text-right">
            <div className="text-xs font-semibold text-white">{user?.full_name || user?.username}</div>
            <div className="text-[10px] text-amber-400 font-medium flex items-center justify-end gap-1">
              <Shield className="w-2.5 h-2.5" />
              {user?.role_name}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Keluar dari akun"
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
