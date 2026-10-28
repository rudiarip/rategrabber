import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { ShieldCheck, KeyRound, Check, RefreshCw, AlertCircle, Info } from 'lucide-react';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(1);
  const [matrixData, setMatrixData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadRoles() {
      try {
        const data = await apiRequest('/api/v1/roles');
        setRoles(data || []);
      } catch (err) {
        console.error('Gagal load roles:', err);
      }
    }
    loadRoles();
  }, []);

  useEffect(() => {
    async function loadMatrix() {
      if (!selectedRoleId) return;
      setLoading(true);
      setMessage('');
      try {
        const data = await apiRequest(`/api/v1/roles/matrix/${selectedRoleId}`);
        setMatrixData(data);
      } catch (err) {
        console.error('Gagal memuat matriks izin:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMatrix();
  }, [selectedRoleId]);

  function togglePermission(menuIndex, permIndex) {
    if (selectedRoleId === 1) return; // Super Admin cannot be restricted

    const newMatrix = [...matrixData.matrix];
    const item = newMatrix[menuIndex].permissions[permIndex];
    item.granted = !item.granted;
    setMatrixData({ ...matrixData, matrix: newMatrix });
  }

  async function handleSave() {
    if (selectedRoleId === 1) return;
    setSaving(true);
    setMessage('');

    try {
      const payload = matrixData.matrix.map((m) => ({
        menu_id: m.menu_id,
        permission_ids: m.permissions.filter((p) => p.granted).map((p) => p.permission_id),
      }));

      await apiRequest(`/api/v1/roles/matrix/${selectedRoleId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage('Hak akses role berhasil disimpan!');
    } catch (err) {
      alert(err.message || 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Role & Hak Akses (RBAC Matrix)</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Atur hak akses fungsional (View, Create, Update, Delete) per menu untuk masing-masing level pengguna
        </p>
      </div>

      {/* Role Selector Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
        {roles.map((role) => (
          <button
            key={role.id}
            type="button"
            onClick={() => setSelectedRoleId(role.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              selectedRoleId === role.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{role.name}</span>
            {role.id === 1 && (
              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-950/40 text-amber-950">
                Full Akses
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notice Banner */}
      {selectedRoleId === 1 ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-xs">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Role Super Admin:</strong> Memiliki seluruh hak akses tanpa batas ke semua menu dan fitur secara permanen.
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-3 text-blue-300 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>Centang izin yang ingin diberikan kepada role ini. Menu di sidebar hanya akan tampil jika izin <strong>View</strong> aktif.</span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-xl font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Hak Akses'}
          </button>
        </div>
      )}

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          {message}
        </div>
      )}

      {/* Permissions Matrix Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            <span>Memuat matriks izin...</span>
          </div>
        ) : !matrixData ? null : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-5 min-w-[200px]">Menu Sistem</th>
                  {matrixData.matrix[0]?.permissions.map((p) => (
                    <th key={p.permission_id} className="py-3.5 px-3 text-center min-w-[90px]">
                      {p.permission_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {matrixData.matrix.map((menu, mIdx) => (
                  <tr key={menu.menu_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-white">
                      <div>{menu.menu_name}</div>
                      {menu.link && <div className="text-[10px] text-slate-500 font-mono">{menu.link}</div>}
                    </td>

                    {menu.permissions.map((p, pIdx) => (
                      <td key={p.permission_id} className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={p.granted}
                          disabled={selectedRoleId === 1}
                          onChange={() => togglePermission(mIdx, pIdx)}
                          className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-amber-500 focus:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
