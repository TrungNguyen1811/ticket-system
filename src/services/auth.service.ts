import api from "@/lib/axios"
import type { LoginCredentials, AuthUser } from "@/types/auth"
import type { Response } from "@/types/reponse"

export interface LoginResponse {
  user: AuthUser
  token: string
  refreshToken?: string
}
export interface MeResponse {
  user: AuthUser
}

export interface RefreshTokenResponse {
  token: string
  refreshToken?: string
}

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post<Response<LoginResponse>>("/auth/login", credentials)
      return response.data.data
    } catch (error) {
      throw error
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout")
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error)
    }
  }

  // // Refresh token
  // async refreshToken(): Promise<RefreshTokenResponse> {
  //   const refreshToken = localStorage.getItem("refresh_token")

  //   if (!refreshToken) {
  //     throw new Error("No refresh token available")
  //   }

  //   try {
  //     const response = await api.post<RefreshTokenResponse>("/auth/refresh", {
  //       refreshToken,
  //     })
  //     return response.data
  //   } catch (error) {
  //     // Clear tokens if refresh fails
  //     localStorage.removeItem("auth_token")
  //     localStorage.removeItem("refresh_token")
  //     localStorage.removeItem("auth_user")
  //     throw error
  //   }
  // }

  // Get current user profile
  async getCurrentUser(): Promise<AuthUser> {
    try {
      const response = await api.get<Response<MeResponse>>("/auth/me")
      return response.data.data.user
    } catch (error) {
      throw error
    }
  }

  // // Update user profile
  // async updateProfile(data: Partial<AuthUser>): Promise<AuthUser> {
  //   try {
  //     const response = await api.put<AuthUser>("/auth/profile", data)
  //     return response.data
  //   } catch (error) {
  //     throw error
  //   }
  // }

  // // Change password
  // async changePassword(data: {
  //   currentPassword: string
  //   newPassword: string
  //   confirmPassword: string
  // }): Promise<void> {
  //   try {
  //     await api.post("/auth/change-password", data)
  //   } catch (error) {
  //     throw error
  //   }
  // }

  // // Request password reset
  // async requestPasswordReset(email: string): Promise<void> {
  //   try {
  //     await api.post("/auth/forgot-password", { email })
  //   } catch (error) {
  //     throw error
  //   }
  // }

  // // Reset password
  // async resetPassword(data: {
  //   token: string
  //   password: string
  //   confirmPassword: string
  // }): Promise<void> {
  //   try {
  //     await api.post("/auth/reset-password", data)
  //   } catch (error) {
  //     throw error
  //   }
  // }
}

export const authService = new AuthService()
