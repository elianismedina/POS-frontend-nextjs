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

  async getCashiers(): Promise<User[]> {
    console.log("=== STARTING getCashiers ===");

    // Get all cashiers using the new cashiers endpoint
    let allCashiers: User[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      try {
        console.log(`Fetching cashiers page ${currentPage}...`);
        const cashiers = await this.getAllCashiers(currentPage, 100);
        console.log(
          `Received ${cashiers.length} cashiers from page ${currentPage}`
        );

        if (cashiers.length === 0) {
          console.log(
            `No cashiers in page ${currentPage}, stopping pagination`
          );
          hasMore = false;
        } else {
          allCashiers = [...allCashiers, ...cashiers];
          console.log(`Total cashiers collected so far: ${allCashiers.length}`);

          // If we got less than the limit, we've reached the end
          if (cashiers.length < 100) {
            console.log(
              `Received less than 100 cashiers (${cashiers.length}), stopping pagination`
            );
            hasMore = false;
          } else {
            currentPage++;
          }
        }
      } catch (error) {
        console.error(`Error fetching cashiers page ${currentPage}:`, error);
        hasMore = false;
      }
    }

    console.log(`Total cashiers fetched: ${allCashiers.length}`);
    console.log(`All cashiers:`, allCashiers);

    // If we couldn't fetch any cashiers, return empty array instead of throwing
    if (allCashiers.length === 0) {
      console.warn("No cashiers could be fetched from the API");
      return [];
    }

    return allCashiers;
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
