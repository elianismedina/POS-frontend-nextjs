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
  createdAt: string;
  updatedAt: string;
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

  static async getPhysicalTable(id: string): Promise<PhysicalTable> {
    const response = await api.get(`/physical-tables/${id}`);
    return response.data;
  }

  static async getPhysicalTablesByBranch(
    branchId: string
  ): Promise<PhysicalTable[]> {
    const response = await api.get(`/physical-tables/branch/${branchId}`);
    return response.data;
  }

  static async getPhysicalTablesByBusiness(
    businessId: string
  ): Promise<PhysicalTable[]> {
    const response = await api.get(`/physical-tables/business/${businessId}`);
    return response.data;
  }
}
