import { createContext, useContext, useState } from 'react';
import { getCookie, setCookie, deleteCookie } from '../utils/cookies';

interface AuthContextProps {
  token: string | null;
  matchMakerId: string | null;
  login: (token: string, matchMakerId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(getCookie('token'));
  const [matchMakerId, setMatchMakerId] = useState<string | null>(
    getCookie('matchMakerId')
  );

  const login = (t: string, id: string) => {
    setToken(t);
    setMatchMakerId(id);
    setCookie('token', t);
    setCookie('matchMakerId', id);
  };

  const logout = () => {
    setToken(null);
    setMatchMakerId(null);
    deleteCookie('token');
    deleteCookie('matchMakerId');
  };

  return (
    <AuthContext.Provider value={{ token, matchMakerId, login, logout }}>
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
