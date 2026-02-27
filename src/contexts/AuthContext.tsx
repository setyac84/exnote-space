import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Division } from '@/types';
import { mockUsers } from '@/data/mock';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  activeDivision: Division;
  setActiveDivision: (d: Division) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [activeDivision, setActiveDivision] = useState<Division>('creative');

  const login = (email: string, _password: string) => {
    const found = mockUsers.find(u => u.email === email);
    if (found) {
      setUser(found);
      setActiveDivision(found.division);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, activeDivision, setActiveDivision }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
