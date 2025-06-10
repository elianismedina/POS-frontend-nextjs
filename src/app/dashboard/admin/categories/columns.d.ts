import { ColumnDef } from "@tanstack/react-table";

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const columns: ColumnDef<Category>[];
