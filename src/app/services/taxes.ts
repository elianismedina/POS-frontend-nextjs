import { api } from "@/lib/api";

export interface Tax {
  id: string;
  name: string;
  description?: string;
  rate: number;
  businessId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const taxesService = {
  // Get taxes for a specific business
  async getByBusinessId(businessId: string): Promise<Tax[]> {
    const response = await api.get(`/taxes/business/${businessId}`);
    return response.data;
  },

  // Get all taxes (for admin purposes)
  async getAll(): Promise<Tax[]> {
    const response = await api.get("/taxes");
    return response.data;
  },

  // List taxes for a business (alias for getByBusinessId)
  async listTaxes(businessId: string): Promise<Tax[]> {
    return this.getByBusinessId(businessId);
  },

  // Get tax by ID
  async getById(id: string): Promise<Tax> {
    const response = await api.get(`/taxes/${id}`);
    return response.data;
  },

  // Create a new tax
  async create(tax: {
    name: string;
    description?: string;
    rate: number;
    businessId: string;
  }): Promise<Tax> {
    const response = await api.post("/taxes", tax);
    return response.data;
  },

  // Create tax (alias for create)
  async createTax(tax: {
    name: string;
    description?: string;
    rate: number;
    businessId: string;
  }): Promise<Tax> {
    return this.create(tax);
  },

  // Create a test tax
  async createTestTax(): Promise<Tax> {
    const testTax = {
      name: "Test Tax",
      description: "A test tax for development purposes",
      rate: 0.1, // 10%
      businessId: "", // This will be set by the backend
    };
    const response = await api.post("/taxes", testTax);
    return response.data;
  },

  // Update a tax
  async update(
    id: string,
    tax: {
      name?: string;
      description?: string;
      rate?: number;
    }
  ): Promise<Tax> {
    const response = await api.patch(`/taxes/${id}`, tax);
    return response.data;
  },

  // Delete a tax
  async delete(id: string): Promise<void> {
    await api.delete(`/taxes/${id}`);
  },
};
