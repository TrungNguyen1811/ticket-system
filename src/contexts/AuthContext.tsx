// "use client"

// import type React from "react"
// import { createContext, useContext, useState, useEffect } from "react"
// import type { AuthUser, LoginCredentials, AuthContextType } from "@/types/auth"
// import { authService } from "@/services/auth.service"
// import { useToast } from "@/components/ui/use-toast"

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useToast } from '@/components/ui/use-toast';
import { authService } from '@/services/auth.service';
import { User } from '@/types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { 
    isAuthenticated, 
    isLoading: isAuth0Loading, 
    user: auth0User, 
    loginWithRedirect, 
    logout: auth0Logout,
    getAccessTokenSilently 
  } = useAuth0();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const login = async () => {
    try {
      await loginWithRedirect({
        appState: { returnTo: window.location.pathname }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to login",
        variant: "destructive",
      });
    }
  };

  const logout = () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  };

  const getAccessToken = async () => {
    try {
      const token = await getAccessTokenSilently();
      if (token) {
        localStorage.setItem('auth_token', token);
        return token;
      }
      return undefined;
    } catch (error) {
      console.error('Error getting access token:', error);
      return undefined;
    }
  };

  // Initialize or update user data
  const initializeUser = async () => {
    if (isAuth0Loading) return;

    if (isAuthenticated && auth0User) {
      try {
        // Get token first
        const token = await getAccessToken();
        if (!token) {
          throw new Error('No access token available');
        }

        // Get user data from backend
        const response = await authService.getCurrentUser();
        if (response) {
          setUser(response);
          localStorage.setItem('user', JSON.stringify(response));
        } else {
          throw new Error('User not found in backend');
        }
      } catch (error) {
        console.error('Error initializing user:', error);
        toast({
          title: "Error",
          description: "Failed to initialize user session",
          variant: "destructive",
        });
        // Clear invalid session
        setUser(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    } else {
      setUser(null);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    initializeUser();
  }, [isAuthenticated, isAuth0Loading, auth0User]);

  // Token refresh effect
  useEffect(() => {
    if (isAuthenticated && user) {
      const refreshInterval = setInterval(async () => {
        try {
          await getAccessToken();
          console.log('Token refreshed successfully');
        } catch (error) {
          console.error('Error refreshing token:', error);
          // If token refresh fails, clear session
          setUser(null);
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
        }
      }, 1000 * 60 * 30); // Refresh every 30 minutes

      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated, user]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
