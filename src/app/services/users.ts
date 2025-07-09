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

export interface CashierWithBranch extends User {
  branch?: {
    id: string;
    name: string;
  };
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
  async getAllUsers(page: number = 1, limit: number = 100): Promise<User[]> {
    try {
      const response = await api.get(`/users?page=${page}&limit=${limit}`);

      // The backend returns a paginated response with data and meta properties
      console.log(`API Response for page ${page}:`, response.data);
      console.log(`Response data type:`, typeof response.data);
      console.log(`Response data keys:`, Object.keys(response.data || {}));

      // Check if response has data property (paginated response)
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        console.log(
          `Found paginated response with ${response.data.data.length} users`
        );
        return response.data.data;
      }

      // Fallback: if response is directly an array
      if (Array.isArray(response.data)) {
        console.log(
          `Found direct array response with ${response.data.length} users`
        );
        return response.data;
      }

      // If response is neither paginated nor array, return empty array
      console.warn("Unexpected response format:", response.data);
      return [];
    } catch (error) {
      console.error(`Error fetching users page ${page}:`, error);
      throw error;
    }
  },

  async getAllCashiers(page: number = 1, limit: number = 100): Promise<User[]> {
    try {
      const response = await api.get(`/cashiers?page=${page}&limit=${limit}`);

      // The backend returns a paginated response with data and meta properties
      console.log(`Cashiers API Response for page ${page}:`, response.data);
      console.log(`Response data type:`, typeof response.data);
      console.log(`Response data keys:`, Object.keys(response.data || {}));

      // Check if response has data property (paginated response)
      if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        console.log(
          `Found paginated response with ${response.data.data.length} cashiers`
        );
        return response.data.data;
      }

      // Fallback: if response is directly an array
      if (Array.isArray(response.data)) {
        console.log(
          `Found direct array response with ${response.data.length} cashiers`
        );
        return response.data;
      }

      // If response is neither paginated nor array, return empty array
      console.warn("Unexpected response format:", response.data);
      return [];
    } catch (error) {
      console.error(`Error fetching cashiers page ${page}:`, error);
      throw error;
    }
  },

  async getCashiers(businessId?: string): Promise<User[]> {
    console.log("=== STARTING getCashiers ===");

    try {
      console.log("Fetching cashiers from /cashiers endpoint...");
      const params = businessId ? { businessId } : {};
      const response = await api.get("/cashiers", { params });
      console.log("Cashiers API Response:", response.data);

      // Check if response is an array
      if (Array.isArray(response.data)) {
        console.log(`Found ${response.data.length} cashiers`);
        return response.data;
      }

      // If response is not an array, return empty array
      console.warn("Unexpected response format:", response.data);
      return [];
    } catch (error) {
      console.error("Error fetching cashiers:", error);
      return [];
    }
  },

  async getCashiersByBranch(branchId?: string): Promise<CashierWithBranch[]> {
    // Get all cashiers and filter by branch if specified
    const cashiers = await this.getCashiers();

    if (branchId) {
      return cashiers.filter((cashier) => cashier.branch?.id === branchId);
    }

    return cashiers;
  },
};
