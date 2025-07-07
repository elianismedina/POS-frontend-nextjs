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
    try {
      const response = await api.get("/branches/my-business-simple");
      // Handle the _props wrapper if present
      const branches = response.data.map((branch: any) => {
        const branchData = branch._props || branch;
        return {
          id: branchData.id,
          name: branchData.name,
          address: branchData.address,
          phone: branchData.phone,
          email: branchData.email,
          isActive: branchData.isActive,
          businessId: branchData.businessId,
          createdAt: branchData.createdAt,
          updatedAt: branchData.updatedAt,
        };
      });
      return branches;
    } catch (error) {
      console.error("Error fetching branches:", error);
      throw error;
    }
  },
};
