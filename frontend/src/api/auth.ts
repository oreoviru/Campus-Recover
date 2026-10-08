/**
 * Campus Recover — Auth API Client Functions
 */

import apiClient from "./client";
import {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types";

export const authApi = {
  /**
   * Log in user with credentials.
   */
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", data);
    return res.data;
  },

  /**
   * Register a new student or staff user.
   */
  register: async (data: RegisterRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/register", data);
    return res.data;
  },

  /**
   * Fetch current authenticated user's profile.
   */
  getMe: async (): Promise<ApiResponse<User>> => {
    const res = await apiClient.get<ApiResponse<User>>("/auth/me");
    return res.data;
  },

  /**
   * Log out session.
   */
  logout: async (): Promise<ApiResponse<{ user_id: string }>> => {
    const res = await apiClient.post<ApiResponse<{ user_id: string }>>("/auth/logout");
    return res.data;
  },
};
