import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
}

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/signin", data);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await api.post<{ accessToken: string }>("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  }

  async verifyToken(token: string): Promise<boolean> {
    try {
      // Instead of making a request, we'll verify the token locally
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      return currentTime < expirationTime;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post("/auth/signout");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }
}

export const authService = new AuthService();
