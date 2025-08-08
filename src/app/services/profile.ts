import { api } from "@/lib/api";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  businessId?: string;
  businessName?: string;
  branchId?: string;
  branchName?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export const profileService = {
  // Get current user profile
  async getProfile(): Promise<UserProfile> {
    const response = await api.get("/users/profile");
    return response.data;
  },

  // Update user profile
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await api.patch("/users/profile", data);
    return response.data;
  },

  // Get user's shift history
  async getShiftHistory(): Promise<any[]> {
    const response = await api.get("/users/shifts");
    return response.data;
  },

  // Get user's schedule
  async getSchedule(): Promise<any[]> {
    const response = await api.get("/users/schedule");
    return response.data;
  },
};
