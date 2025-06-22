import { api } from "@/lib/api";

export interface Tax {
  id: string;
  name: string;
  rate: number;
  description?: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxData {
  name: string;
  rate: number;
  description?: string;
  businessId: string;
}

export const taxesService = {
  async listTaxes(businessId?: string): Promise<Tax[]> {
    try {
      let endpoint = "/taxes";

      // If businessId is provided, use the business-specific endpoint
      if (businessId) {
        endpoint = `/taxes/business/${businessId}`;
      }

      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error("Frontend: Error calling listTaxes API:", error);
      throw error;
    }
  },

  async getTaxById(id: string): Promise<Tax> {
    const response = await api.get(`/taxes/${id}`);
    return response.data;
  },

  async getTaxesByBusiness(businessId: string): Promise<Tax[]> {
    const response = await api.get(`/taxes/business/${businessId}`);
    return response.data;
  },

  async createTax(data: CreateTaxData): Promise<Tax> {
    const payload = {
      name: data.name,
      rate: data.rate,
      description: data.description || undefined,
      businessId: data.businessId,
    };

    const response = await api.post("/taxes", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  async createTestTax(): Promise<Tax> {
    const response = await api.post("/taxes/test");
    return response.data;
  },
};
