import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { authService } from '../services';
import { supabase } from '../services/supabase/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string; role?: Role }) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role: string; department?: string }) => Promise<User>;
  logout: () => Promise<void>;
  switchDemoRole: (role: Role) => Promise<void>;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to keep Supabase profiles table in real-time sync with logged in user
const syncProfileToSupabase = async (u: User) => {
  try {
    const userUuid =
      u.id && u.id.includes('-') && u.id.length === 36
        ? u.id
        : u.role === 'admin'
        ? '10000000-0000-0000-0000-000000000004'
        : u.role === 'faculty'
        ? '10000000-0000-0000-0000-000000000002'
        : '10000000-0000-0000-0000-000000000001';

    await supabase.from('profiles').upsert(
      {
        id: userUuid,
        email: u.email || `${u.role || 'user'}@ritindia.edu`,
        full_name: u.name,
        role: u.role,
        department: 'Computer Science & Engineering',
      },
      { onConflict: 'id' }
    );
  } catch (err) {
    console.error('Supabase profile sync error:', err);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('smart_campus_auth_token');
      const storedUser = localStorage.getItem('smart_campus_auth_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          const parsed: User = JSON.parse(storedUser);
          if (parsed.role === 'faculty' && parsed.name?.startsWith('Student (')) {
            parsed.name = parsed.name.replace(/^Student \(/, 'Prof. (');
            localStorage.setItem('smart_campus_auth_user', JSON.stringify(parsed));
          } else if (parsed.role === 'admin' && parsed.name?.startsWith('Student (')) {
            parsed.name = parsed.name.replace(/^Student \(/, 'Admin (');
            localStorage.setItem('smart_campus_auth_user', JSON.stringify(parsed));
          }
          setUser(parsed);
          syncProfileToSupabase(parsed);
        } catch {
          localStorage.removeItem('smart_campus_auth_user');
          localStorage.removeItem('smart_campus_auth_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleExpired = () => {
      setUser(null);
      setToken(null);
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    };

    window.addEventListener('auth:session-expired', handleExpired);
    return () => window.removeEventListener('auth:session-expired', handleExpired);
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string; role?: Role }): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.login(credentials);
      setUser(res.data.user);
      setToken(res.data.token);
      syncProfileToSupabase(res.data.user);
      return res.data.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (data: { name: string; email: string; password: string; role: string; department?: string }): Promise<User> => {
      setIsLoading(true);
      try {
        const res = await authService.register(data);
        setUser(res.data.user);
        setToken(res.data.token);
        syncProfileToSupabase(res.data.user);
        return res.data.user;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  // Quick switcher between demo roles for convenience
  const switchDemoRole = useCallback(
    async (newRole: Role) => {
      setIsLoading(true);
      try {
        const email = `${newRole}@ritindia.edu`;
        const res = await authService.login({ email, password: 'password123' });
        setUser(res.data.user);
        setToken(res.data.token);
        syncProfileToSupabase(res.data.user);
      } catch {
        if (user) {
          let updatedName = user.name;
          if (newRole === 'faculty' && updatedName.startsWith('Student (')) {
            updatedName = updatedName.replace(/^Student \(/, 'Prof. (');
          } else if (newRole === 'admin' && updatedName.startsWith('Student (')) {
            updatedName = updatedName.replace(/^Student \(/, 'Admin (');
          } else if (newRole === 'student' && (updatedName.startsWith('Prof. (') || updatedName.startsWith('Admin ('))) {
            updatedName = updatedName.replace(/^(Prof\.|Admin) \(/, 'Student (');
          }
          const updated: User = { ...user, role: newRole, name: updatedName };
          setUser(updated);
          localStorage.setItem('smart_campus_auth_user', JSON.stringify(updated));
          syncProfileToSupabase(updated);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
    localStorage.setItem('smart_campus_auth_user', JSON.stringify(updated));
    syncProfileToSupabase(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        switchDemoRole,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
