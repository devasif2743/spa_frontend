import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginWeb } from './authApi';


const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
 useEffect(() => {
    const storedUser = localStorage.getItem('user_details');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);



 const login = async (credentials) => {
    try {
      const response = await loginWeb(credentials);

    console.log("ddd",response.data);
      if (response.data.status) {
        const { user,access_token } = response.data;

        // save in localStorage
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_details', JSON.stringify(user));

        setUser(user);

        return { success: true, user };
      } else {
        return { success: false, error: response.data.message || 'Login failed' };
      }
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_details');
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};