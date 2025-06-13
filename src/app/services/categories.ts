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

export const categoriesService = {
  async listCategories(): Promise<Category[]> {
    const response = await api.get("/categories");
    return response.data;
  },

  async createCategory(data: CreateCategoryData): Promise<Category> {
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
};
