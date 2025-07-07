import { api } from "@/lib/api";

export interface PhysicalTable {
  id: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
  location?: string;
  isActive: boolean;
  businessId: string;
  branchId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePhysicalTableDto {
  tableNumber: string;
  tableName?: string;
  capacity?: number;
  location?: string;
  businessId: string;
  branchId: string;
}

export interface UpdatePhysicalTableDto {
  tableNumber?: string;
  tableName?: string;
  capacity?: number;
  location?: string;
  isActive?: boolean;
}

export class PhysicalTablesService {
  static async getPhysicalTables(): Promise<PhysicalTable[]> {
    const response = await api.get("/physical-tables");
    return response.data;
  }

  static async getAvailablePhysicalTables(): Promise<PhysicalTable[]> {
    const response = await api.get("/physical-tables/available");
    return response.data;
  }

  static async createPhysicalTable(
    data: CreatePhysicalTableDto
  ): Promise<PhysicalTable> {
    const response = await api.post("/physical-tables", data);
    return response.data;
  }

  static async updatePhysicalTable(
    id: string,
    data: UpdatePhysicalTableDto
  ): Promise<PhysicalTable> {
    const response = await api.put(`/physical-tables/${id}`, data);
    return response.data;
  }

  static async deletePhysicalTable(id: string): Promise<void> {
    await api.delete(`/physical-tables/${id}`);
  }
}
