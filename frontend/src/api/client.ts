/**
 * Campus Recover — Axios API Client
 *
 * Centralized HTTP client with:
 * - Base URL from environment
 * - JWT token injection via request interceptor
 * - 401 handling via response interceptor
 * - Typed request helpers
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 seconds
});

// ---- Request Interceptor: Attach JWT ----
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("access_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor: Handle 401 ----
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear stored token and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");

      // Only redirect if not already on login/register page
      const path = window.location.pathname;
      if (!path.startsWith("/login") && !path.startsWith("/register")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
