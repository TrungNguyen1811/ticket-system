import axios from "axios";
import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { toast } from "@/components/ui/use-toast";

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    // Log request in development
    if (import.meta.env.DEV) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          data: config.data,
          params: config.params,
        },
      );
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  },
);

// Response interceptor - Handle responses and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log response in development
    if (import.meta.env.DEV) {
      const startTime = response.config.metadata?.startTime;
      const duration = startTime
        ? new Date().getTime() - startTime.getTime()
        : 0;
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`,
        {
          status: response.status,
          duration: `${duration}ms`,
          data: response.data,
        },
      );
    }

    return response;
  },
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error("❌ API Error:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle different error scenarios
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          if (!originalRequest) {
            return Promise.reject(error);
          }

          if (isRefreshing) {
            // If token refresh is in progress, add request to queue
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return api(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Try to refresh token using Auth0
            const auth0 = (window as any).auth0;
            if (auth0) {
              const newToken = await auth0.getAccessTokenSilently();
              localStorage.setItem("auth_token", newToken);

              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
              }

              processQueue(null, newToken);
              return api(originalRequest);
            } else {
              // If Auth0 is not available, redirect to login
              localStorage.removeItem("auth_token");
              localStorage.removeItem("user");

              if (window.location.pathname !== "/login") {
                toast({
                  title: "Session Expired",
                  description: "Please log in again to continue.",
                  variant: "destructive",
                });
                window.location.href = "/login";
              }
            }
          } catch (refreshError) {
            processQueue(refreshError, null);
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
          break;

        case 403:
          // Forbidden
          toast({
            title: "Access Denied",
            description: "You don't have permission to perform this action.",
            variant: "destructive",
          });
          break;

        case 404:
          // Not found
          toast({
            title: "Not Found",
            description:
              data?.message || "The requested resource was not found.",
            variant: "destructive",
          });
          break;

        case 422:
          // Validation error
          toast({
            title: "Validation Error",
            description:
              data?.message || "Please check your input and try again.",
            variant: "destructive",
          });
          break;

        case 429:
          // Rate limit
          toast({
            title: "Too Many Requests",
            description: "Please wait a moment before trying again.",
            variant: "destructive",
          });
          break;

        case 500:
          // Server error
          toast({
            title: "Server Error",
            description:
              "Something went wrong on our end. Please try again later.",
            variant: "destructive",
          });
          break;

        default:
          // Generic error
          toast({
            title: "Error",
            description: data?.message || "An unexpected error occurred.",
            variant: "destructive",
          });
      }
    } else if (error.request) {
      // Network error
      toast({
        title: "Network Error",
        description:
          "Unable to connect to the server. Please check your internet connection.",
        variant: "destructive",
      });
    } else {
      // Other error
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }

    return Promise.reject(error);
  },
);

// Add request/response types for TypeScript
declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
    _retry?: boolean;
  }
}

export default api;
