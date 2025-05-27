import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = "http://localhost:3000/api/v1/auth";
const USERS_API_URL = "http://localhost:3000/api/v1/users";

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
  createdAt: Date | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    console.log("AuthService - Making login request to:", `${API_URL}/signin`);
    const response = await axios.post(`${API_URL}/signin`, data);
    console.log("AuthService - Login response:", response.data);

    if (response.data.accessToken && !response.data.user) {
      console.log("AuthService - Decoding token to get user ID");
      const decoded = jwtDecode<JwtPayload>(response.data.accessToken);
      console.log("AuthService - Decoded token:", decoded);

      console.log("AuthService - Fetching user info");
      const userResponse = await axios.get(`${USERS_API_URL}/${decoded.sub}`, {
        headers: {
          Authorization: `Bearer ${response.data.accessToken}`,
        },
      });
      console.log("AuthService - User info response:", userResponse.data);

      const userData = {
        ...userResponse.data,
        name: normalizeName(userResponse.data.name),
        createdAt: normalizeDate(userResponse.data.createdAt),
      };

      console.log("AuthService - Transformed user data:", userData);

      return {
        accessToken: response.data.accessToken,
        user: userData,
      };
    }

    if (response.data.accessToken && response.data.user) {
      console.log("AuthService - Transforming login user data");
      const userData = {
        ...response.data.user,
        name: normalizeName(response.data.user.name),
        createdAt: normalizeDate(response.data.user.createdAt),
      };

      console.log("AuthService - Transformed login user data:", userData);

      return {
        accessToken: response.data.accessToken,
        user: userData,
      };
    }

    throw new Error("Invalid login response format");
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    console.log(
      "AuthService - Making register request to:",
      `${API_URL}/register`
    );
    const response = await axios.post(`${API_URL}/register`, data);
    console.log("AuthService - Register response:", response.data);
    return response.data;
  },
};

// Helper functions to normalize data
function normalizeName(name: unknown): string {
  console.log("normalizeName - Input:", name, "Type:", typeof name);
  if (typeof name === "object" && name !== null && "value" in name) {
    const value = (name as { value: unknown }).value;
    console.log("normalizeName - Value:", value, "Type:", typeof value);
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
    console.warn("normalizeName - Invalid name.value, returning 'User'");
    return "User";
  }
  if (typeof name === "string" && name.trim() !== "") {
    return name;
  }
  console.warn("normalizeName - Invalid name, returning 'User'");
  return "User";
}

function normalizeDate(date: unknown): Date | null {
  console.log("normalizeDate - Input:", date, "Type:", typeof date);
  if (!date || (typeof date === "object" && Object.keys(date).length === 0)) {
    console.warn(
      "normalizeDate - Date is null, undefined, or empty object, returning null"
    );
    return null;
  }
  if (typeof date === "object" && date !== null && "value" in date) {
    const value = (date as { value: unknown }).value;
    console.log("normalizeDate - Value:", value, "Type:", typeof value);
    if (typeof value === "string" && value.trim() !== "") {
      const parsedDate = new Date(value);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    console.warn("normalizeDate - Invalid date.value, returning null");
    return null;
  }
  const parsedDate = new Date(date as string);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  console.warn("normalizeDate - Invalid date, returning null");
  return null;
}
