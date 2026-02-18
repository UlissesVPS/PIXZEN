import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '@/services/authApi';

interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  created_at: string;
  profile?: { id: string; nome: string | null; avatar_url: string | null };
  assinante?: { id: string; status: string; plano: string; criado_em: string; data_expiracao: string | null };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo user mock
const DEMO_USER: User = {
  id: 'demo-user-id',
  email: 'demo@pixzen.app',
  name: 'Usuario Demo',
  is_admin: false,
  created_at: new Date().toISOString(),
  profile: { id: 'demo-profile', nome: 'Usuario Demo', avatar_url: null },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(() => {
    return localStorage.getItem('pixzen-demo-mode') === 'true';
  });

  // Token refresh: re-validate session periodically
  useEffect(() => {
    // If in demo mode, set demo user
    if (isDemoMode) {
      setUser(DEMO_USER);
      setIsLoading(false);
      return;
    }

    // Check for existing token and validate with API
    const token = localStorage.getItem('pixzen-token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const validateToken = () => {
      authApi.getMe()
        .then(({ data }) => {
          setUser(data.user || data);
          // If server returns a new token, update it
          if (data.token) {
            localStorage.setItem('pixzen-token', data.token);
          }
        })
        .catch((err) => {
          // Only clear if truly unauthorized (401), not network errors
          if (err?.response?.status === 401) {
            localStorage.removeItem('pixzen-token');
            localStorage.removeItem('pixzen-user');
            setUser(null);
          }
          // For network errors, keep current user state
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    validateToken();

    // Re-validate every 30 minutes to keep session alive
    const refreshInterval = setInterval(validateToken, 30 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [isDemoMode]);

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data } = await authApi.signUp(email, password, name);
      if (data.token) {
        localStorage.setItem('pixzen-token', data.token);
      }
      if (data.user) {
        setUser(data.user);
      }
      return { error: null };
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Erro ao criar conta';
      return { error: new Error(message) };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data } = await authApi.signIn(email, password);
      if (data.token) {
        localStorage.setItem('pixzen-token', data.token);
      }
      if (data.user) {
        setUser(data.user);
      }
      return { error: null };
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.message || err.message || 'Erro ao fazer login';
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      exitDemoMode();
      return;
    }
    localStorage.removeItem('pixzen-token');
    localStorage.removeItem('pixzen-user');
    setUser(null);
    // Navigate to auth page
    window.location.href = '/auth';
  };

  const enterDemoMode = () => {
    localStorage.setItem('pixzen-demo-mode', 'true');
    setIsDemoMode(true);
    setUser(DEMO_USER);
    setIsLoading(false);
  };

  const exitDemoMode = () => {
    localStorage.removeItem('pixzen-demo-mode');
    setIsDemoMode(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isDemoMode,
      signUp,
      signIn,
      signOut,
      enterDemoMode,
      exitDemoMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
