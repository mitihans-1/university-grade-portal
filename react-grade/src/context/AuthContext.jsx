import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Permission checking utilities
  const hasPermission = (permission) => {
    return user && user.permissions && user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions) => {
    return user && user.permissions && permissions.some(permission =>
      user.permissions.includes(permission)
    );
  };

  const isAdmin = () => hasPermission('manage_users');
  const isTeacher = () => hasAnyPermission(['enter_grades', 'view_students']);
  const isStudent = () => hasPermission('view_own_grades');
  const isParent = () => hasPermission('view_child_grades');

  useEffect(() => {
    // Check if we have a token and fetch user data from the API
    const token = localStorage.getItem('token');
    if (token) {
      const fetchUser = async () => {
        try {
          const userData = await api.getUser();
          if (userData && !userData.msg) {
            setUser(userData);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.warn('Error fetching user (session may be expired):', error);
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      };

      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const result = await api.login(email, password);

      if (result.token && result.user) {
        // Save token to localStorage
        localStorage.setItem('token', result.token);
        setUser(result.user);
        return { success: true, user: result.user };
      } else {
        return { success: false, message: result.msg || 'Invalid credentials' };
      }
    } catch (error) {
      console.warn('Login attempt failed:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const logout = async () => {
    try {
      // Call the logout API endpoint
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Remove token and user data
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    // Note: In a real implementation, you would update the user via an API call
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      loading,
      hasPermission,
      hasAnyPermission,
      isAdmin,
      isTeacher,
      isStudent,
      isParent
    }}>
      {children}
    </AuthContext.Provider>
  );
};