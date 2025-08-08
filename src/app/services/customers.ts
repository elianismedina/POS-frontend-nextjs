import { api } from "@/lib/api";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  documentNumber?: string;
  isActive: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCustomerDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  documentNumber?: string;
  businessId: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  documentNumber?: string;
  isActive?: boolean;
}

export class CustomersService {
  static async getCustomers(
    params?: PaginationParams
  ): Promise<PaginatedResponse<Customer>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const response = await api.get(`/customers?${queryParams.toString()}`);
    return response.data;
  }

  static async getCustomer(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  }

  static async createCustomer(data: CreateCustomerDto): Promise<Customer> {
    const response = await api.post("/customers", data);
    return response.data;
  }

  static async updateCustomer(
    id: string,
    data: UpdateCustomerDto
  ): Promise<Customer> {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  }

  static async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  }

  static async getCustomersByBusiness(): Promise<Customer[]> {
    const response = await api.get(`/customers/my-business-customers`);
    return response.data.data || response.data; // Handle both paginated and direct response
  }

  static async findCustomerByEmail(email: string): Promise<Customer | null> {
    try {
      const response = await api.get(`/customers/email/${email}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async findCustomerByDocument(
    documentNumber: string
  ): Promise<Customer | null> {
    try {
      const response = await api.get(`/customers/document/${documentNumber}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }
}
