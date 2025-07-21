import { api } from "@/lib/api";

export interface Branch {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchDto {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  businessId: string;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export async function getBranches() {
  const res = await api.get("/branches/my-business");
  return res.data;
}

export class BranchesService {
  static async getBranches(): Promise<Branch[]> {
    const response = await api.get("/branches/my-business");
    return response.data;
  }

  static async getBranch(id: string): Promise<Branch> {
    const response = await api.get(`/branches/${id}`);
    return response.data;
  }

  static async createBranch(data: CreateBranchDto): Promise<Branch> {
    const response = await api.post("/branches", data);
    return response.data;
  }

  static async updateBranch(
    id: string,
    data: UpdateBranchDto
  ): Promise<Branch> {
    const response = await api.put(`/branches/${id}`, data);
    return response.data;
  }

  static async deleteBranch(id: string): Promise<void> {
    await api.delete(`/branches/${id}`);
  }

  static async getBranchesByBusiness(businessId: string): Promise<Branch[]> {
    const response = await api.get(`/branches/business/${businessId}`);
    return response.data;
  }

  static async getMyBusinessBranches(): Promise<Branch[]> {
    const response = await api.get("/branches/my-business");
    return response.data;
  }
}
