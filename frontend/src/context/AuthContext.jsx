import { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('alquilisto_user');
    const storedToken = localStorage.getItem('alquilisto_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  function persistSession({ user, token }) {
    localStorage.setItem('alquilisto_token', token);
    localStorage.setItem('alquilisto_user', JSON.stringify(user));
    setUser(user);
  }

  async function register({ email, password, role }) {
    const data = await AuthService.register({ email, password, role });
    persistSession(data);
    return data.user;
  }

  async function login({ email, password }) {
    const data = await AuthService.login({ email, password });
    persistSession(data);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('alquilisto_token');
    localStorage.removeItem('alquilisto_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  return ctx;
}
