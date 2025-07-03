import { api } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: {
    name: string;
  };
  business?: {
    id: string;
    name: string;
  };
  branch?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsersResponse {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const usersService = {
  async getAllUsers(
    page: number = 0,
    limit: number = 100
  ): Promise<PaginatedUsersResponse> {
    const response = await api.get(`/users?page=${page}&limit=${limit}`);
    return response.data;
  },

  async getCashiers(): Promise<User[]> {
    // Get all users and filter for cashiers
    const response = await this.getAllUsers(0, 1000);
    return response.data.filter((user) => user.role.name === "CASHIER");
  },
};
