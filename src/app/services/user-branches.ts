import { api } from "@/lib/api";

export interface UserBranch {
  id: string;
  userId: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserBranchRequest {
  userId: string;
  branchId: string;
}

export const userBranchesService = {
  async assignUserToBranch(data: CreateUserBranchRequest): Promise<UserBranch> {
    const response = await api.post("/user-branches", data);
    return response.data;
  },

  async removeUserFromBranch(userId: string, branchId: string): Promise<void> {
    await api.delete(`/user-branches/${userId}/${branchId}`);
  },

  async getUserBranches(userId: string): Promise<UserBranch[]> {
    const response = await api.get(`/user-branches/user/${userId}`);
    return response.data;
  },

  async getBranchManagers(branchId: string): Promise<UserBranch[]> {
    const response = await api.get(`/user-branches/branch/${branchId}`);
    return response.data;
  },

  async isUserBranchManager(
    userId: string,
    branchId: string
  ): Promise<boolean> {
    const response = await api.get(
      `/user-branches/check/${userId}/${branchId}`
    );
    return response.data.isManager;
  },
};
