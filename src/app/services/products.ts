import { api } from "@/lib/api";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  barcode?: string;
  discountable: boolean;
  businessId: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  createdAt: string;
  updatedAt: string;
}

export const productsService = {
  async getByBusinessId(businessId: string): Promise<Product[]> {
    const response = await api.get(
      `/products/list/by-business?businessId=${businessId}`
    );
    return response.data;
  },

  async getById(id: string): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async create(
    data: Omit<Product, "id" | "createdAt" | "updatedAt">
  ): Promise<Product> {
    const response = await api.post("/products", data);
    return response.data;
  },

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
