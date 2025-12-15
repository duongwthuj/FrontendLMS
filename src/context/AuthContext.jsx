import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
        try {
            const decoded = jwtDecode(token);
            // Check expiry
            if (decoded.exp * 1000 < Date.now()) {
                logout();
            } else {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            logout();
        }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Use relative path via axois instance (api.js) to leverage proxy
      // This handles both local and public tunnel access correctly
      const data = await api.post('/auth/login', { username, password });
      
      // Axios throws on error status, so we don't need manual !response.ok check
      // Data is already parsed by interceptor



      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (roles) => {
      if (!user) return false;
      if (Array.isArray(roles)) {
          return roles.includes(user.role);
      }
      return user.role === roles;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
