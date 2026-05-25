import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('udhaar_token');
    localStorage.removeItem('udhaar_user');
    setUser(null);
  }, []);

  // Check if user session is active on page mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('udhaar_token');
      const storedUser = localStorage.getItem('udhaar_user');
      
      if (storedToken && storedUser) {
        try {
          // Fetch current profile to ensure token is still active
          const res = await api.get('/auth/profile');
          if (res.data.success) {
            const updatedUser = res.data.data;
            setUser(updatedUser);
            localStorage.setItem('udhaar_user', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Session verification failed, logging out:', error.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, [logout]);

  // Login handler
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, user: userData } = res.data;
        localStorage.setItem('udhaar_token', token);
        localStorage.setItem('udhaar_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Register shop keeper handler
  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      if (res.data.success) {
        const { token, user: createdUser } = res.data;
        localStorage.setItem('udhaar_token', token);
        localStorage.setItem('udhaar_user', JSON.stringify(createdUser));
        setUser(createdUser);
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout handler is declared above with useCallback to prevent hoisting errors

  // Update profile or shop metadata (e.g. UPI, Name, Phone)
  const updateProfileSettings = async (settingsData) => {
    try {
      const res = await api.put('/auth/profile', settingsData);
      if (res.data.success) {
        const updatedUser = res.data.data;
        setUser(updatedUser);
        localStorage.setItem('udhaar_user', JSON.stringify(updatedUser));
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfileSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
