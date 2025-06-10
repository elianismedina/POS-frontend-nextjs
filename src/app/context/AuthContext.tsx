"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthResponse, User, authService } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (response: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem("refreshToken");
      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("Refreshing token...");
      const { accessToken } = await authService.refreshToken(
        storedRefreshToken
      );
      console.log("Token refresh successful");

      setToken(accessToken);
      localStorage.setItem("accessToken", accessToken);
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken(storedToken);

          // Verify token is still valid
          try {
            await authService.verifyToken(storedToken);
          } catch {
            console.log("Token verification failed, attempting refresh");
            await refreshToken();
          }
        } catch (error) {
          console.error("Error loading stored auth data:", error);
          logout();
        }
      }
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  const login = (response: AuthResponse) => {
    const userData: User = {
      id: response.id,
      name: response.name,
      email: response.email,
      role: response.role,
      createdAt: null,
    };

    setUser(userData);
    setToken(response.accessToken);
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    refreshToken,
    isAuthenticated: !!token && !!user,
  };

  if (!isInitialized) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
