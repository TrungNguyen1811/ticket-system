// "use client"

// import type React from "react"
// import { createContext, useContext, useState, useEffect } from "react"
// import type { AuthUser, LoginCredentials, AuthContextType } from "@/types/auth"
// import { authService } from "@/services/auth.service"
// import { useToast } from "@/components/ui/use-toast"

import { createContext, useContext, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    loginWithRedirect, 
    logout: auth0Logout,
    getAccessTokenSilently 
  } = useAuth0();
  const { toast } = useToast();

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
  };

  const getAccessToken = async () => {
    try {
      const token = await getAccessTokenSilently();
      console.log('Got new token:', token ? 'Token received' : 'No token');
      // Store token in localStorage
      localStorage.setItem('auth_token', token);
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return undefined;
    }
  };

  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, isLoading, hasUser: !!user });
    
    const initializeAuth = async () => {
      // If still loading, wait
      if (isLoading) {
        console.log('Auth0 is still loading, pending...');
        return;
      }

      // If authenticated, update token and user info
      if (isAuthenticated && user) {
        console.log('User is authenticated, updating session...');
        try {
          const token = await getAccessToken();
          if (token) {
            localStorage.setItem('user', JSON.stringify(user));
            (window as any).auth0 = {
              getAccessTokenSilently
            };
            console.log('Session updated successfully');
          } else {
            console.error('Failed to get token');
          }
        } catch (error) {
          console.error('Error updating session:', error);
        }
      } 
      // If not authenticated and not loading, check if we need to clear session
      else if (!isLoading) {
        console.log('Not authenticated, checking stored session...');
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user');
        
        // Only clear if we have no stored data
        if (!storedToken || !storedUser) {
          console.log('No stored session found, clearing...');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          delete (window as any).auth0;
        } else {
          console.log('Found stored session, keeping it for now');
        }
      }
    };

    initializeAuth();
  }, [isAuthenticated, isLoading, user, getAccessTokenSilently]);

  // Add a separate effect to handle token refresh
  useEffect(() => {
    if (isAuthenticated && user) {
      const refreshInterval = setInterval(async () => {
        try {
          await getAccessToken();
          console.log('Token refreshed successfully');
        } catch (error) {
          console.error('Error refreshing token:', error);
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
