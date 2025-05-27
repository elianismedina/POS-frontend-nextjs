"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthResponse, User } from "../services/auth.service";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (response: AuthResponse) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
function transformUserData(user: User | null): User | null {
  console.log("AuthContext - Transforming user data:", user);
  if (!user) {
    console.log("AuthContext - User is null, returning null");
    return null;
  }

  const name = user.name;
  const createdAt = user.createdAt;
  console.log("AuthContext - User name:", name, "Type:", typeof name);
  console.log(
    "AuthContext - User createdAt:",
    createdAt,
    "Type:",
    typeof createdAt
  );

  let transformedName: string;
  if (typeof name === "object" && name !== null && "value" in name) {
    const value = (name as { value: unknown }).value;
    console.log("AuthContext - Name.value:", value, "Type:", typeof value);
    transformedName =
      typeof value === "string" && value.trim() !== "" ? value : "User";
  } else {
    transformedName =
      typeof name === "string" && name.trim() !== "" ? name : "User";
  }

  const transformedCreatedAt = normalizeDate(createdAt);

  const transformedUser = {
    ...user,
    name: transformedName,
    createdAt: transformedCreatedAt,
  };

  console.log("AuthContext - Transformed user data:", transformedUser);
  return transformedUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken"); // Match authService
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        console.log("AuthContext - Loading stored auth data");
        const parsedUser = JSON.parse(storedUser);
        console.log("AuthContext - Parsed stored user:", parsedUser);
        const transformedUser = transformUserData(parsedUser);
        if (transformedUser) {
          setUser(transformedUser);
          setToken(storedToken);
        } else {
          throw new Error("Invalid stored user data");
        }
      } catch (error) {
        console.error("AuthContext - Error loading stored auth data:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (response: AuthResponse) => {
    console.log("AuthContext - Login called with:", response);

    if (!response.accessToken || !response.user) {
      console.error("AuthContext - Invalid login response:", response);
      return;
    }

    try {
      const transformedUser = transformUserData(response.user);
      if (!transformedUser) {
        throw new Error("Failed to transform user data");
      }
      console.log("AuthContext - Setting user state:", transformedUser);

      setUser(transformedUser);
      setToken(response.accessToken);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("user", JSON.stringify(transformedUser));

      console.log("AuthContext - Auth state updated successfully");
    } catch (error) {
      console.error("AuthContext - Error updating auth state:", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
  };

  const logout = () => {
    console.log("AuthContext - Logout called");
    setUser(null);
    setToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!token && !!user, // Require both token and user
  };

  console.log("AuthContext - Current state:", value);

  if (!isInitialized) {
    console.log("AuthContext - Not initialized, returning null");
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
function normalizeDate(createdAt: Date | string | null): Date | null {
  if (!createdAt) {
    return null;
  }

  if (typeof createdAt === "string") {
    const parsedDate = new Date(createdAt);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (createdAt instanceof Date) {
    return isNaN(createdAt.getTime()) ? null : createdAt;
  }

  console.warn("normalizeDate - Unexpected createdAt format:", createdAt);
  return null;
}

function login(user: User, token: string) {
  setUser(user);
  setToken(token);
  localStorage.setItem("accessToken", token);
  console.log("AuthContext - User logged in:", user);
}
