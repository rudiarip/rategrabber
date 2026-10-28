import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest, getToken, setToken, getStoredUser, setStoredUser } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [user, setUserState] = useState(getStoredUser());
  const [navigation, setNavigation] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user profile & navigation dynamically from backend
  const refreshUserData = useCallback(async () => {
    const curToken = getToken();
    if (!curToken) {
      setUserState(null);
      setNavigation([]);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch current user profile
      const userProfile = await apiRequest('/api/v1/auth/me');
      setUserState(userProfile);
      setStoredUser(userProfile);

      // 2. Fetch personalized dynamic navigation tree loaded based on RBAC permissions
      const navData = await apiRequest('/api/v1/menus/my-navigation');
      setNavigation(navData || []);
    } catch (err) {
      console.warn('Sesi login tidak valid:', err.message);
      setToken(null);
      setStoredUser(null);
      setUserState(null);
      setNavigation([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUserData();

    // Auto logout on 401 unauthorized
    function handleUnauthorized() {
      setTokenState(null);
      setUserState(null);
      setNavigation([]);
    }
    window.addEventListener('tapstar:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('tapstar:unauthorized', handleUnauthorized);
  }, [refreshUserData]);

  async function login(username_or_email, password) {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email, password }),
    });

    const accessToken = res.token.access_token;
    setToken(accessToken);
    setTokenState(accessToken);
    setUserState(res.user);
    setStoredUser(res.user);

    // Fetch authorized menus
    const navData = await apiRequest('/api/v1/menus/my-navigation');
    setNavigation(navData || []);

    return res.user;
  }

  function logout() {
    setToken(null);
    setStoredUser(null);
    setTokenState(null);
    setUserState(null);
    setNavigation([]);
  }

  /**
   * RBAC Permission Checker:
   * Checks whether the current user has the specified action on the given menu.
   * Role 1 (Super Admin) always returns true!
   */
  const can = useCallback((menuLink, action = 'view') => {
    if (!user) return false;
    
    // Super Admin gets full unrestricted access without limits
    if (user.role_id === 1) return true;

    if (!menuLink) return true;

    // Helper to search recursively in navigation tree
    function searchTree(items) {
      for (const item of items) {
        if (item.link === menuLink) {
          return item.permissions && item.permissions.includes(action.toLowerCase());
        }
        if (item.children && item.children.length > 0) {
          const found = searchTree(item.children);
          if (found !== undefined) return found;
        }
      }
      return false;
    }

    return searchTree(navigation);
  }, [user, navigation]);

  const value = {
    user,
    token,
    navigation,
    loading,
    login,
    logout,
    can,
    refreshUserData,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
