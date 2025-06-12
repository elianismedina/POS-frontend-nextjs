import { api } from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  isActive?: boolean;
}

export const categoriesService = {
  async listCategories(): Promise<Category[]> {
    try {
      const response = await api.get("/categories");
      console.log("List categories response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error listing categories:", error);
      throw error;
    }
  },

  async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      const response = await api.post("/categories", data);
      console.log("Create category response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },
};
