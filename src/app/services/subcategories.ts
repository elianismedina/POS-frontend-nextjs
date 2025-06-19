import { api } from "@/lib/api";

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubcategoryData {
  categoryId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface UpdateSubcategoryData {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  categoryId: string;
}

export interface UpdateSubcategoryResponse {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  categoryId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
  message: string;
}

export interface SoftDeleteSubcategoryResponse {
  message: string;
  subcategoryId: string;
}

export const subcategoriesService = {
  async list(categoryId?: string): Promise<Subcategory[]> {
    const response = await api.get("/subcategories", {
      params: categoryId ? { categoryId } : {},
    });
    return response.data;
  },

  async create(data: CreateSubcategoryData): Promise<Subcategory> {
    const payload = {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description || undefined,
      imageUrl: data.imageUrl || undefined,
      isActive: data.isActive ?? true,
    };

    console.log("Sending payload:", payload);
    const response = await api.post("/subcategories", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  async updateSubcategory(
    subcategoryId: string,
    data: UpdateSubcategoryData
  ): Promise<UpdateSubcategoryResponse> {
    const response = await api.put(`/subcategories/${subcategoryId}`, data);
    return response.data;
  },

  async softDeleteSubcategory(
    subcategoryId: string
  ): Promise<SoftDeleteSubcategoryResponse> {
    const response = await api.delete(`/subcategories/${subcategoryId}/soft`);
    return response.data;
  },

  async reactivateSubcategory(subcategoryId: string): Promise<Subcategory> {
    const response = await api.patch(
      `/subcategories/${subcategoryId}/reactivate`
    );
    return response.data;
  },
};
