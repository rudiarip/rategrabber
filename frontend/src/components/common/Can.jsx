import React from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Permission Gate Component:
 * Conditionally renders children only if the logged-in user possesses the required permission.
 * 
 * Usage:
 * <Can menu="/admin/cards" action="create">
 *   <button>Tambah Kartu</button>
 * </Can>
 */
export default function Can({ menu, action = 'view', children, fallback = null }) {
  const { can } = useAuth();

  if (!can(menu, action)) {
    return fallback;
  }

  return <>{children}</>;
}
