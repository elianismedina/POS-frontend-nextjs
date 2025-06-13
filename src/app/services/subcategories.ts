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
};
