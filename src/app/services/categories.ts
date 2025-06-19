import { api } from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface CreateCategoryResponse {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  businessId: string;
  wasReactivated: boolean;
  message: string;
}

export interface SoftDeleteCategoryResponse {
  message: string;
  categoryId: string;
  deletedAt: string;
  isActive: boolean;
}

export interface ReactivateCategoryResponse {
  message: string;
  categoryId: string;
  reactivatedAt: string;
  isActive: boolean;
}

export const categoriesService = {
  async listCategories(): Promise<Category[]> {
    const response = await api.get("/categories");
    console.log("Raw categories response:", response.data);
    console.log("Number of categories returned:", response.data.length);
    console.log(
      "Categories with isActive false:",
      response.data.filter((cat: any) => !cat.isActive).length
    );
    return response.data;
  },

  async debugCategories(): Promise<any> {
    const response = await api.get("/categories/debug");
    console.log("Debug response:", response.data);
    return response.data;
  },

  async createCategory(
    data: CreateCategoryData
  ): Promise<CreateCategoryResponse> {
    // Create a clean object with only the properties we want to send
    const payload = {
      name: data.name,
      description: data.description || undefined,
      imageUrl: data.imageUrl || undefined,
      isActive: data.isActive ?? true,
    };

    console.log("Sending payload:", payload);
    const response = await api.post("/categories", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  async softDeleteCategory(
    categoryId: string
  ): Promise<SoftDeleteCategoryResponse> {
    const response = await api.delete(`/categories/${categoryId}/soft`);
    return response.data;
  },

  async reactivateCategory(
    categoryId: string
  ): Promise<ReactivateCategoryResponse> {
    const response = await api.patch(`/categories/${categoryId}/reactivate`);
    return response.data;
  },
};
