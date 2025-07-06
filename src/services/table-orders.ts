import { api } from "@/lib/api";

export interface TableOrder {
  id: string;
  tableNumber: string;
  tableName?: string;
  status: "active" | "closed" | "cancelled";
  notes?: string;
  numberOfCustomers: number;
  totalAmount: number;
  businessId: string;
  branchId: string;
  createdBy: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  orders?: any[];
}

export interface CreateTableOrderDto {
  tableNumber: string;
  tableName?: string;
  notes?: string;
  numberOfCustomers?: number;
  businessId: string;
  branchId: string;
}

export class TableOrdersService {
  static async createTableOrder(
    data: CreateTableOrderDto
  ): Promise<TableOrder> {
    const response = await api.post("/table-orders", data);
    return response.data;
  }

  static async getTableOrders(): Promise<TableOrder[]> {
    const response = await api.get("/table-orders");
    return response.data;
  }

  static async getTableOrder(id: string): Promise<TableOrder> {
    const response = await api.get(`/table-orders/${id}`);
    return response.data;
  }

  static async closeTableOrder(id: string): Promise<TableOrder> {
    const response = await api.put(`/table-orders/${id}/close`);
    return response.data;
  }

  static async cancelTableOrder(id: string): Promise<TableOrder> {
    const response = await api.put(`/table-orders/${id}/cancel`);
    return response.data;
  }

  static async deleteTableOrder(id: string): Promise<void> {
    await api.delete(`/table-orders/${id}`);
  }

  static async updateTableOrder(
    id: string,
    data: Partial<CreateTableOrderDto>
  ): Promise<TableOrder> {
    const response = await api.put(`/table-orders/${id}`, data);
    return response.data;
  }
}
