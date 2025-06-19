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

export interface UpdateCategoryResponse {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  businessId: string;
  updatedAt: string;
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

  async checkCategoryDeletable(categoryId: string): Promise<{
    canDelete: boolean;
    message?: string;
    subcategoryCount?: number;
    subcategoryNames?: string[];
  }> {
    try {
      const response = await api.get(
        `/categories/${categoryId}/check-deletable`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          canDelete: false,
          message: "Category not found",
        };
      }
      // For other errors, we'll let the actual delete operation handle them
      return { canDelete: true };
    }
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

  async updateCategory(
    categoryId: string,
    data: {
      name: string;
      description?: string;
      imageUrl?: string;
      isActive?: boolean;
    }
  ): Promise<UpdateCategoryResponse> {
    const response = await api.put(`/categories/${categoryId}`, data);
    return response.data;
  },
};
