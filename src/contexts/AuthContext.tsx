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
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    user: auth0User,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Compute actual authentication state
  const isAuthenticated = auth0IsAuthenticated && !!user;

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

  const logout = async () => {
    console.log("🔄 Starting logout process...");
    try {
      // Clear local state first
      console.log("🧹 Clearing local state...");
      localStorage.removeItem("auth_token");
      setUser(null);

      // Then logout from Auth0
      console.log("🚪 Logging out from Auth0...");
      await auth0Logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
      console.log("✅ Logout completed");
    } catch (error) {
      console.error("❌ Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
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
      if (!token) throw new Error("No token found");

      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user from backend", error);
      localStorage.removeItem("auth_token");
      setUser(null);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;
    console.log("🔄 Auth state changed:", {
      auth0IsAuthenticated,
      auth0IsLoading,
      hasUser: !!auth0User,
    });

    const initializeAuth = async () => {
      if (auth0IsLoading || !isMounted) {
        console.log("⏳ Skipping initialization:", {
          auth0IsLoading,
          isMounted,
        });
        return;
      }

      try {
        if (auth0IsAuthenticated && auth0User) {
          console.log("🔄 Refreshing user data...");
          await refreshUser();
        } else if (!auth0IsAuthenticated) {
          console.log("🧹 Clearing auth state...");
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      } catch (error) {
        console.error("❌ Failed to initialize auth:", error);
      } finally {
        if (isMounted) {
          console.log("✅ Auth initialization completed");
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log("🧹 Cleaning up auth effect");
      isMounted = false;
    };
  }, [auth0IsAuthenticated, auth0IsLoading, auth0User]);

  // Refresh token and user data every 30 mins
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let isMounted = true;

    const refreshSession = async () => {
      if (!isMounted || !auth0IsAuthenticated || !isInitialized) {
        console.log("⏳ Skipping refresh:", {
          isMounted,
          auth0IsAuthenticated,
          isInitialized,
        });
        return;
      }

      console.log("🔄 Refreshing session...");
      try {
        await getAccessToken();
        await refreshUser();
        console.log("✅ Session refreshed");
      } catch (error) {
        console.error("❌ Failed to refresh session:", error);
        if (isMounted) {
          console.log("🧹 Clearing auth state after refresh failure");
          localStorage.removeItem("auth_token");
          setUser(null);
        }
      }
    };

    if (auth0IsAuthenticated && isInitialized) {
      console.log("⏰ Setting up refresh interval");
      interval = setInterval(refreshSession, 1000 * 60 * 30); // 30 mins
    }

    return () => {
      console.log("🧹 Cleaning up refresh effect");
      isMounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [auth0IsAuthenticated, isInitialized]);

  // Don't render children until auth is initialized
  if (!isInitialized || isLoading) {
    console.log("⏳ Waiting for auth initialization...");
    return null;
  }

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
