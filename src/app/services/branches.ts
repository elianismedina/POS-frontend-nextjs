import { api } from "@/lib/api";

export const branchesService = {
  async getById(branchId: string) {
    const response = await api.get(`/branches/${branchId}`);
    return response.data;
  },
};
