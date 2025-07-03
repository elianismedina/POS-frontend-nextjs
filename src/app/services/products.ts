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

export interface PaginatedProductsResponse {
  products: Product[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ProductsListParams {
  businessId: string;
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
}

export const productsService = {
  async getByBusinessId(businessId: string): Promise<Product[]> {
    const response = await api.get(
      `/products/list/by-business?businessId=${businessId}`
    );
    return response.data;
  },

  async getPaginated(
    params: ProductsListParams
  ): Promise<PaginatedProductsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append("businessId", params.businessId);

    if (params.page !== undefined) {
      queryParams.append("page", params.page.toString());
    }
    if (params.limit !== undefined) {
      queryParams.append("limit", params.limit.toString());
    }
    if (params.search) {
      queryParams.append("search", params.search);
    }
    if (params.categoryId) {
      queryParams.append("categoryId", params.categoryId);
    }
    if (params.categoryName) {
      queryParams.append("categoryName", params.categoryName);
    }
    if (params.subcategoryId) {
      queryParams.append("subcategoryId", params.subcategoryId);
    }

    const response = await api.get(
      `/products/list/paginated?${queryParams.toString()}`
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
