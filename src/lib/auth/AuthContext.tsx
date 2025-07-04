"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

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
      console.log("User data fetched successfully:", response.data);

      // Ensure role data is present
      if (!response.data.role || !response.data.role.name) {
        console.error("User data missing role information");
        throw new Error("User data missing role information");
      }

      // Ensure business data is present for admin users
      if (
        response.data.role.name === "ADMIN" &&
        (!response.data.business ||
          !Array.isArray(response.data.business) ||
          response.data.business.length === 0)
      ) {
        console.error("Admin user missing business information");
        throw new Error("Admin user missing business information");
      }

      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (storedToken && storedRefreshToken) {
          console.log("Found stored tokens, attempting to fetch user data");
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);

          try {
            await fetchUserData(storedToken);
          } catch (error) {
            console.error("Error fetching user data:", error);
            // If token is invalid or role data is missing, clear everything
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            setToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (accessToken: string, refreshToken: string) => {
    try {
      console.log("Logging in with tokens");
      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setToken(accessToken);
      setRefreshToken(refreshToken);

      await fetchUserData(accessToken);
    } catch (error) {
      console.error("Error during login:", error);
      // Clear tokens if login fails
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
      console.log("Logging out");
      // Call the backend signout endpoint
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
      console.error("Error during signout:", error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setToken(null);
      setRefreshToken(null);
      setUser(null);
      // Use replace instead of push to prevent back navigation
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
