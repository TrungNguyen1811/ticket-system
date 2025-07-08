import api from "@/lib/axios";
import { LoginSchema } from "@/schema/auth.schema";
import type { User } from "@/types/user";
import type {
  CallbackResponse,
  Response,
} from "@/types/response";

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface MeResponse {
  user: User;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
}

class AuthService {
  // Login user
  async login(credentials: LoginSchema): Promise<LoginResponse> {
    try {
      const response = await api.post<Response<LoginResponse>>(
        "/auth/login",
        credentials,
      );
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  async loginWithSlack(): Promise<void> {
    try {
      const response = await api.get("/auth/slack/login");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error);
    }
  }

  // Refresh token
  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await api.post<RefreshTokenResponse>("/auth/refresh", {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      // Clear tokens if refresh fails
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("auth_user");
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<Response<MeResponse>>("/auth/me");
      return response.data.data.user;
    } catch (error) {
      console.error("Failed to get current user:", error);
      throw error;
    }
  }

  async initiateSlackIntegration(): Promise<void> {
    try {
      const response =
        await api.get<Response<{ url: string }>>("/slack/connect-url");
      window.location.href = response.data.data.url;
    } catch (error) {
      throw error;
    }
  }

  async disconnectSlackIntegration(): Promise<Response<{ url: string }>> {
    try {
      const response =
        await api.post<Response<{ url: string }>>("/slack/disconnect");
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async slackCallback(code: string, state: string): Promise<void> {
    try {
      const response = await api.post<CallbackResponse>("/slack/callback", {
        code,
        state,
      });
      if (response.data.success) {
        window.location.href = "/";
      } else {
        window.location.href = "/slack=error";
      }
    } catch (error) {
      throw error;
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

export const authService = new AuthService();
