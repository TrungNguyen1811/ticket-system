"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "@/types/user";
import { authService } from "@/services/auth.service";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
  getAccessToken: () => Promise<string | undefined>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isLoading,
    user: auth0User,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  const login = async () => {
    try {
      await loginWithRedirect({
        appState: { returnTo: window.location.pathname },
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Could not redirect to login.",
        variant: "destructive",
      });
    }
  };

  const logout = () => {
    auth0Logout({
      logoutParams: { returnTo: window.location.origin },
    });
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  const getAccessToken = async (): Promise<string | undefined> => {
    try {
      const token = await getAccessTokenSilently();
      localStorage.setItem("auth_token", token);
      return token;
    } catch (error) {
      console.error("Failed to get access token:", error);
      localStorage.removeItem("auth_token");
      setUser(null);
      return undefined;
    }
  };

  const refreshUser = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("No token found");
      }

      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user from backend", error);
      toast({
        title: "Session error",
        description: "Could not fetch user data. Please login again.",
        variant: "destructive",
      });
      logout();
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (isLoading) return;

      if (isAuthenticated && auth0User) {
        await refreshUser();
      } else if (!isAuthenticated) {
        localStorage.removeItem("auth_token");
        setUser(null);
      }
    };

    initializeAuth();
  }, [isAuthenticated, isLoading, auth0User]);

  // Refresh token and user data every 30 mins
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(async () => {
        try {
          await getAccessToken();
          await refreshUser();
        } catch (error) {
          console.error("Failed to refresh session:", error);
          logout();
        }
      }, 1000 * 60 * 30); // 30 mins

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        getAccessToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
