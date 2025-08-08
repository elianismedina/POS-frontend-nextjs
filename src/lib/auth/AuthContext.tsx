"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { FullScreenLoader } from "@/components/ui/full-screen-loader";

interface User {
  id: string;
  email: string;
  name: string;
  role: {
    name: string;
  };
  business?: Array<{
    id: string;
    name: string;
    branchLimit: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  branch?: {
    id: string;
    name: string;
    business: {
      id: string;
      name: string;
      branchLimit: number;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
  };
  userBranches?: Array<{
    branch: {
      id: string;
      name: string;
      business: {
        id: string;
        name: string;
        branchLimit: number;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    };
  }>;
}

interface Business {
  id: string;
  name: string;
  branchLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = async (accessToken: string) => {
    try {
      const response = await api.post(
        "/auth/whoami",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Ensure role data is present
      if (!response.data.role || !response.data.role.name) {
        throw new Error("User data missing role information");
      }

      // Ensure business data is present for admin users
      if (
        response.data.role.name === "admin" &&
        (!response.data.business ||
          !Array.isArray(response.data.business) ||
          response.data.business.length === 0)
      ) {
        throw new Error("Admin user missing business information");
      }

      setUser(response.data);
      return response.data;
    } catch (error: any) {
      // Handle specific error types
      if (error.response?.status === 401) {
        // Clear tokens on authentication failure
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        throw new Error("Authentication failed - please log in again");
      } else if (error.response?.status === 404) {
        throw new Error("Authentication service unavailable");
      } else {
        throw error;
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (storedToken && storedRefreshToken) {
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);

          try {
            await fetchUserData(storedToken);
          } catch (error) {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            setToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        } else {
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (accessToken: string, refreshToken: string) => {
    try {
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setToken(accessToken);
      setRefreshToken(refreshToken);

      await fetchUserData(accessToken);
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post(
          "/auth/signout",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      router.replace("/");
    }
  };

  const value = {
    user,
    token,
    refreshToken,
    isAuthenticated: !!user && !!user.role?.name,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading && <FullScreenLoader message="Initializing..." />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
