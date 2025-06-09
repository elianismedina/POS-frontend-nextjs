import axios from "axios";
import { environment } from "../config/environment";

const API_URL = environment.authUrl;

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date | null;
}

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    console.log("AuthService - Making login request to:", `${API_URL}/signin`);
    const response = await axios.post(`${API_URL}/signin`, data);
    console.log("AuthService - Login response:", response.data);

    return {
      id: response.data.id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log(
      "AuthService - Making register request to:",
      `${API_URL}/register`
    );
    const response = await axios.post(`${API_URL}/signup`, data);
    console.log("AuthService - Register response:", response.data);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await axios.post(`${API_URL}/refresh`, {
      refreshToken,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        await axios.post(
          `${API_URL}/signout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },
};
