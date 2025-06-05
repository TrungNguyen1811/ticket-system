import axios from "axios"
import type { AxiosResponse, InternalAxiosRequestConfig, AxiosError } from "axios"
import { toast } from "@/components/ui/use-toast"

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem("auth_token")

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      })
    }

    return config
  },
  (error) => {
    console.error("❌ Request Error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      const startTime = response.config.metadata?.startTime
      const duration = startTime ? new Date().getTime() - startTime.getTime() : 0
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        duration: `${duration}ms`,
        data: response.data,
      })
    }

    return response
  },
  (error: AxiosError<{ message?: string }>) => {
    // Log error in development
    if (import.meta.env.DEV) {
      console.error("❌ API Error:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      })
    }

    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_user")

          // Only redirect if not already on login page
          if (window.location.pathname !== "/login") {
            toast({
              title: "Session Expired",
              description: "Please log in again to continue.",
              variant: "destructive",
            })
            window.location.href = "/login"
          }
          break

        case 403:
          // Forbidden
          toast({
            title: "Access Denied",
            description: "You don't have permission to perform this action.",
            variant: "destructive",
          })
          break

        case 404:
          // Not found
          toast({
            title: "Not Found",
            description: data?.message || "The requested resource was not found.",
            variant: "destructive",
          })
          break

        case 422:
          // Validation error
          toast({
            title: "Validation Error",
            description: data?.message || "Please check your input and try again.",
            variant: "destructive",
          })
          break

        case 429:
          // Rate limit
          toast({
            title: "Too Many Requests",
            description: "Please wait a moment before trying again.",
            variant: "destructive",
          })
          break

        case 500:
          // Server error
          toast({
            title: "Server Error",
            description: "Something went wrong on our end. Please try again later.",
            variant: "destructive",
          })
          break

        default:
          // Generic error
          toast({
            title: "Error",
            description: data?.message || "An unexpected error occurred.",
            variant: "destructive",
          })
      }
    } else if (error.request) {
      // Network error
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your internet connection.",
        variant: "destructive",
      })
    } else {
      // Other error
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    }

    return Promise.reject(error)
  },
)

// Add request/response types for TypeScript
declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date
    }
  }
}

export default api
