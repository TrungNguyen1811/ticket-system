"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { AuthUser, LoginCredentials, AuthContextType } from "@/types/auth"
import { authService } from "@/services/auth.service"
import { useToast } from "@/components/ui/use-toast"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token")

      if (token) {
        try {
          // Verify token with backend and get current user
          const userData = await authService.getCurrentUser()
          console.log(userData)
          setUser(userData)
          setIsAuthenticated(true)
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem("auth_token")
          localStorage.removeItem("refresh_token")
          localStorage.removeItem("auth_user")
          console.warn("Invalid token, cleared auth data")
        }
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  // Auto-refresh token before expiry
  useEffect(() => {
    const token = localStorage.getItem("auth_token")

    if (token && user) {
      // Set up token refresh interval (refresh every 14 minutes if token expires in 15 minutes)
      const refreshInterval = setInterval(
        async () => {
          try {
            const { token: newToken, refreshToken: newRefreshToken } = await authService.refreshToken()
            localStorage.setItem("auth_token", newToken)

            if (newRefreshToken) {
              localStorage.setItem("refresh_token", newRefreshToken)
            }
          } catch (error) {
            console.warn("Token refresh failed:", error)
            logout()
          }
        },
        14 * 60 * 1000,
      ) // 14 minutes

      return () => clearInterval(refreshInterval)
    }
  }, [user])

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setIsLoading(true)
    try {
      const mockResponse = await authService.login(credentials)
  
      localStorage.setItem("auth_token", mockResponse.token)
      localStorage.setItem("auth_user", JSON.stringify(mockResponse.user))
      if (mockResponse.refreshToken) {
        localStorage.setItem("refresh_token", mockResponse.refreshToken)
      }
  
      setUser(mockResponse.user)
      setIsAuthenticated(true)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }
  

  const logout = async () => {
    try {
      // Call logout API to invalidate token on server
      await authService.logout()
    } catch (error) {
      console.warn("Logout API call failed:", error)
    } finally {
      // Clear local storage regardless of API call result
      localStorage.removeItem("auth_token")
      localStorage.removeItem("refresh_token")
      localStorage.removeItem("auth_user")
      setUser(null)
      setIsAuthenticated(false)
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
    }
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated 
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// // Mock login function for demo - replace with actual API call
// async function mockLogin(credentials: LoginCredentials) {
//   // Simulate API delay
//   await new Promise((resolve) => setTimeout(resolve, 1000))

//   const mockCredentials = [
//     { email: "admin@example.com", password: "admin123", userId: "user1" },
//     { email: "manager@example.com", password: "manager123", userId: "user4" },
//     { email: "staff@example.com", password: "staff123", userId: "user2" },
//   ]

//   const mockUsers = [
//     { id: "user1", name: "John Admin", email: "admin@example.com", role: "Admin" as const },
//     { id: "user4", name: "Lisa Manager", email: "manager@example.com", role: "Manager" as const },
//     { id: "user2", name: "Sarah Staff", email: "staff@example.com", role: "Staff" as const },
//   ]

//   const mockCred = mockCredentials.find(
//     (cred) => cred.email === credentials.email && cred.password === credentials.password,
//   )

//   if (!mockCred) {
//     throw new Error("Invalid email or password")
//   }

//   const userData = mockUsers.find((u) => u.id === mockCred.userId)
//   if (!userData) {
//     throw new Error("User not found")
//   }

//   return {
//     user: userData,
//     token: `mock_token_${Date.now()}`,
//     refreshToken: `mock_refresh_${Date.now()}`,
//   }
// }

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
