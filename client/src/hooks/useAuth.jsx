import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Parse JWT from cookies if present
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    const token = getCookie('transitly_session');
    const roleCookie = getCookie('transitly_user_role');

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          userId: payload.userId || 101,
          name: payload.name || 'Vikram Malhotra',
          email: payload.email || 'user@transitly.in',
          role: payload.role || roleCookie || 'CUSTOMER'
        });
      } catch (_) {
        setUser(null);
      }
    } else {
      // Default demo state for development preview
      setUser({
        userId: 101,
        name: 'Demo Partner',
        email: 'partner@transitly.in',
        role: roleCookie || 'DELIVERY_PARTNER'
      });
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    document.cookie = `transitly_user_role=${userData.role}; path=/; max-age=86400`;
  };

  const logout = () => {
    setUser(null);
    document.cookie = 'transitly_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'transitly_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const switchRole = (newRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    document.cookie = `transitly_user_role=${newRole}; path=/; max-age=86400`;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
