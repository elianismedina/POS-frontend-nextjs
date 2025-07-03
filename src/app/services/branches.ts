import { api } from "@/lib/api";

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export const branchesService = {
  async getById(branchId: string) {
    const response = await api.get(`/branches/${branchId}`);
    return response.data;
  },

  async getAllBranches(): Promise<Branch[]> {
    const response = await api.get("/branches");
    return response.data;
  },
};
