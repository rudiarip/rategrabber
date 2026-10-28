import React from 'react';
import DynamicSidebar from './DynamicSidebar';
import Topbar from './Topbar';

export default function AdminLayout({ 
  currentPath, 
  onNavigate, 
  serverStatus = 'healthy', 
  title = 'Dashboard', 
  children 
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      {/* Dynamic RBAC Sidebar */}
      <DynamicSidebar 
        currentPath={currentPath} 
        onNavigate={onNavigate} 
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar 
          serverStatus={serverStatus} 
          title={title} 
        />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
