import { api } from "@/lib/api";

export const subcategoriesService = {
  list: (categoryId?: string) =>
    api.get("/subcategories", { params: categoryId ? { categoryId } : {} }),
  create: (data: {
    categoryId: string;
    name: string;
    description?: string;
    isActive?: boolean;
  }) => api.post("/subcategories", data),
};
