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
      console.log("🔍 [AuthContext] Starting fetchUserData...");
      console.log(
        "🔍 [AuthContext] Access token:",
        accessToken ? "present" : "missing"
      );

      const response = await api.post(
        "/auth/whoami",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("🔍 [AuthContext] Whoami response:", response.data);

      // Ensure role data is present
      if (!response.data.role || !response.data.role.name) {
        console.error("❌ [AuthContext] User data missing role information");
        throw new Error("User data missing role information");
      }

      // Ensure business data is present for admin users
      if (
        response.data.role.name === "ADMIN" &&
        (!response.data.business ||
          !Array.isArray(response.data.business) ||
          response.data.business.length === 0)
      ) {
        console.error(
          "❌ [AuthContext] Admin user missing business information"
        );
        throw new Error("Admin user missing business information");
      }

      console.log("✅ [AuthContext] User data validated successfully");
      setUser(response.data);
      return response.data;
    } catch (error: any) {
      // Handle specific error types
      if (error.response?.status === 401) {
        console.error("Authentication failed - token may be expired");
        // Clear tokens on authentication failure
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setToken(null);
        setRefreshToken(null);
        setUser(null);
        throw new Error("Authentication failed - please log in again");
      } else if (error.response?.status === 404) {
        console.error("Whoami endpoint not found");
        throw new Error("Authentication service unavailable");
      } else {
        console.error("Error fetching user data:", error);
        throw error;
      }
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log("🔍 [AuthContext] Starting initializeAuth...");
        const storedToken = localStorage.getItem("token");
        const storedRefreshToken = localStorage.getItem("refreshToken");

        console.log("🔍 [AuthContext] Stored tokens:", {
          token: storedToken ? "present" : "missing",
          refreshToken: storedRefreshToken ? "present" : "missing",
        });

        if (storedToken && storedRefreshToken) {
          console.log("🔍 [AuthContext] Tokens found, setting state...");
          setToken(storedToken);
          setRefreshToken(storedRefreshToken);

          try {
            console.log("🔍 [AuthContext] Fetching user data...");
            await fetchUserData(storedToken);
            console.log("✅ [AuthContext] User data fetched successfully");
          } catch (error) {
            console.error("❌ [AuthContext] Error fetching user data:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            setToken(null);
            setRefreshToken(null);
            setUser(null);
          }
        } else {
          console.log("🔍 [AuthContext] No stored tokens found");
        }
      } catch (error) {
        console.error("❌ [AuthContext] Error in initializeAuth:", error);
      } finally {
        console.log("🔍 [AuthContext] Setting isLoading to false");
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (accessToken: string, refreshToken: string) => {
    try {
      console.log("🔍 [AuthContext] Starting login...");
      console.log("🔍 [AuthContext] Tokens received:", {
        accessToken: accessToken ? "present" : "missing",
        refreshToken: refreshToken ? "present" : "missing",
      });

      localStorage.setItem("token", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      setToken(accessToken);
      setRefreshToken(refreshToken);

      console.log("🔍 [AuthContext] Tokens stored, fetching user data...");
      await fetchUserData(accessToken);
      console.log("✅ [AuthContext] Login completed successfully");
    } catch (error) {
      console.error("❌ [AuthContext] Error during login:", error);
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
