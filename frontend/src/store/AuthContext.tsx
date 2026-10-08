/**
 * Campus Recover — Authentication Context & Provider
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { authApi } from "@/api/auth";
import { User, LoginRequest, RegisterRequest } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state by validating existing token
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            setToken(storedToken);
          } else {
            localStorage.removeItem("access_token");
            setUser(null);
            setToken(null);
          }
        } catch {
          localStorage.removeItem("access_token");
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (data: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      if (res.success && res.data) {
        const { access_token, user: loggedUser } = res.data;
        localStorage.setItem("access_token", access_token);
        setToken(access_token);
        setUser(loggedUser);
        toast.success(`Welcome back, ${loggedUser.name}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Login failed. Please check your credentials.";
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.success && res.data) {
        const { access_token, user: registeredUser } = res.data;
        localStorage.setItem("access_token", access_token);
        setToken(access_token);
        setUser(registeredUser);
        toast.success(`Account registered! Welcome to Campus Recover, ${registeredUser.name}.`);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Registration failed. Please check your details.";
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
    try {
      authApi.logout().catch(() => {});
    } catch {}
    toast.success("Successfully logged out.");
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
