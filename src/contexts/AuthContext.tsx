import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../lib/api';

interface User {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_instructor?: boolean;
  profile_image?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  /** 1. adım: ad/soyad/e-posta gönderilir, e-postaya doğrulama kodu gider. */
  registerStart: (data: { first_name: string; last_name: string; email: string }) => Promise<void>;
  /** 2. adım: kod doğrulanır, şifre belirleme jetonu döner. */
  registerVerify: (email: string, code: string) => Promise<string>;
  /** 3. adım: şifre belirlenir, hesap açılır ve oturum başlar. */
  registerComplete: (data: {
    email: string;
    verify_token: string;
    password: string;
    password_confirm: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);

        // Arka planda güncel kullanıcı verisini çek (profil fotoğrafı vb.)
        fetch(`${API_BASE_URL}/users/${parsedUser.user_id}`, {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        })
          .then(res => {
            if (res.status === 401) {
              // Kullanıcı artık veritabanında yok (DB sıfırlanmış olabilir)
              console.warn('⚠️ Kullanıcı artık veritabanında yok, oturum kapatılıyor...');
              setToken(null);
              setUser(null);
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              return null;
            }
            return res.ok ? res.json() : null;
          })
          .then(result => {
            if (result?.user) {
              setUser(result.user);
              localStorage.setItem('user', JSON.stringify(result.user));
            }
          })
          .catch(() => { }); // Sessizce hata yakala
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş başarısız');
      }

      // Store token and user data
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /** Kayıt uçlarına ortak istek yardımcısı; hata mesajını sunucudan alır. */
  const postRegister = async (path: string, body: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    let data: any = {};
    try {
      data = await response.json();
    } catch {
      throw new Error('Sunucuya ulaşılamadı');
    }

    if (!response.ok) {
      throw new Error(data.error || 'İşlem başarısız');
    }
    return data;
  };

  const registerStart = async (data: { first_name: string; last_name: string; email: string }) => {
    await postRegister('start', data);
  };

  const registerVerify = async (email: string, code: string): Promise<string> => {
    const data = await postRegister('verify', { email, code });
    return data.verify_token as string;
  };

  const registerComplete = async (payload: {
    email: string;
    verify_token: string;
    password: string;
    password_confirm: string;
  }) => {
    const data = await postRegister('complete', payload);

    // Kayıt tamamlanınca doğrudan oturum aç
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const updatedUser = result.user;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('✅ User data refreshed:', updatedUser);
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = {
    user,
    token,
    login,
    registerStart,
    registerVerify,
    registerComplete,
    logout,
    refreshUser,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

