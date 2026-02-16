import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';
import type { User, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchUser = async () => {
    // Force a minimum 2-second wait to show the premium loading screen
    const minWait = new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await apiClient.get<User>('/users/me');
      await minWait;
      setState({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      await minWait;
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      // Small delay even for public pages if we want consistency, 
      // but here we just set it to false.
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    // Explicitly set loading to true before fetching user to trigger the splash screen
    setState(prev => ({ ...prev, isLoading: true }));
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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
