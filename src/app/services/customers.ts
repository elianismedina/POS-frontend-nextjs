import { api } from "@/lib/api";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  documentNumber: string;
  isActive: boolean;
  business: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedCustomerResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  documentNumber: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  documentNumber?: string;
  isActive?: boolean;
}

export const customersService = {
  // Get customers for the current user's business
  async getCustomers(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedCustomerResponse> {
    const response = await api.get(
      `/customers/my-business-customers?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // Get customer by ID
  async getById(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },

  // Create a new customer
  async create(customer: CreateCustomerRequest): Promise<Customer> {
    const response = await api.post("/customers", customer);
    return response.data;
  },

  // Update a customer
  async update(id: string, customer: UpdateCustomerRequest): Promise<Customer> {
    const response = await api.patch(`/customers/${id}`, customer);
    return response.data;
  },

  // Delete a customer
  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },

  // Find customer by email
  async findByEmail(email: string): Promise<Customer | null> {
    try {
      const response = await api.get(`/customers/email/${email}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Find customer by document number
  async findByDocument(documentNumber: string): Promise<Customer | null> {
    try {
      const response = await api.get(`/customers/document/${documentNumber}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};
