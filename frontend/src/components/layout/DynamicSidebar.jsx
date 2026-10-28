import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  QrCode, 
  ListFilter, 
  Layers, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  KeyRound, 
  Menu as MenuIcon,
  LockKeyhole,
  FolderTree,
  ChevronDown, 
  ChevronRight,
  Star,
  Smartphone,
  ExternalLink
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard,
  QrCode,
  ListFilter,
  Layers,
  BarChart3,
  ShieldCheck,
  Users,
  KeyRound,
  Menu: MenuIcon,
  LockKeyhole,
  FolderTree,
};

export default function DynamicSidebar({ currentPath, onNavigate }) {
  const { navigation, user } = useAuth();
  const [openParents, setOpenParents] = useState({ 2: true, 6: true }); // Default expand parents

  function toggleParent(id) {
    setOpenParents(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }

  function renderIcon(iconName) {
    const IconComponent = ICON_MAP[iconName] || Star;
    return <IconComponent className="w-4 h-4 flex-shrink-0" />;
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 min-h-screen text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Star className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="font-extrabold text-white text-lg tracking-tight flex items-center gap-1.5">
              TapStar
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Review Management</div>
          </div>
        </div>
      </div>

      {/* User Status Bar */}
      <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-700 text-amber-400 font-bold flex items-center justify-center text-xs border border-slate-600">
          {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
        </div>
        <div className="overflow-hidden">
          <div className="text-xs font-semibold text-white truncate">{user?.username || 'Admin'}</div>
          <div className="text-[10px] text-amber-400 font-medium truncate">{user?.role_name || 'Super Admin'}</div>
        </div>
      </div>

      {/* Dynamic Nav Items */}
      <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
          Menu Navigasi
        </div>

        {navigation.map(menu => {
          const hasChildren = menu.children && menu.children.length > 0;
          const isParentOpen = !!openParents[menu.id];
          const isActive = currentPath === menu.link;

          if (hasChildren) {
            return (
              <div key={menu.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleParent(menu.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-slate-300"
                >
                  <div className="flex items-center gap-2.5">
                    {renderIcon(menu.icon)}
                    <span>{menu.name}</span>
                  </div>
                  {isParentOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>

                {isParentOpen && (
                  <div className="pl-6 space-y-0.5 border-l border-slate-800 ml-4 my-1">
                    {menu.children.map(child => {
                      const isChildActive = currentPath === child.link;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => onNavigate(child.link)}
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            isChildActive
                              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          {renderIcon(child.icon)}
                          <span>{child.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={menu.id}
              type="button"
              onClick={() => onNavigate(menu.link)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {renderIcon(menu.icon)}
              <span>{menu.name}</span>
            </button>
          );
        })}

        {/* Public Tools / Quick Access */}
        <div className="pt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1">
          Simulasi & Portal
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/simulator')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            currentPath === '/simulator'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>NFC & QR Simulator</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/activate')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
            currentPath === '/activate'
              ? 'bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ExternalLink className="w-4 h-4 text-blue-400" />
          <span>Halaman Aktivasi</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>TapStar Engine v2.0</span>
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          RBAC Active
        </span>
      </div>
    </aside>
  );
}
