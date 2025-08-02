import { createContext, useContext, useState } from 'react';
import { getCookie, setCookie, deleteCookie } from '../utils/cookies';

interface AuthContextProps {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getCookie('token'));

  const login = (t: string) => {
    setToken(t);
    setCookie('token', t);
  };

  const logout = () => {
    setToken(null);
    deleteCookie('token');
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
