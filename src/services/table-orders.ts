import { api } from "@/lib/api";

export interface TableOrderItem {
  id: string;
  totalAmount: number;
  finalAmount: number;
  tipAmount?: number;
  tipPercentage?: number;
  status: string;
  customerName?: string;
  numberOfCustomers?: number;
  createdAt: string;
}

export interface TableOrder {
  id: string;
  tableNumber: string;
  tableName?: string;
  status: "active" | "closed" | "cancelled";
  notes?: string;
  numberOfCustomers: number;
  totalAmount: number;
  finalAmount?: number;
  businessId: string;
  branchId: string;
  createdBy: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  orders?: TableOrderItem[];
  physicalTableId: string;
  completionType?: string;
  customerName?: string;
}

export interface CreateTableOrderDto {
  physicalTableId: string;
  tableNumber?: string;
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

  static async getActiveTableOrders(): Promise<TableOrder[]> {
    try {
      const response = await api.get("/table-orders/active");
      return response.data;
    } catch (error: any) {
      console.error("Error fetching active table orders:", error);
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      throw error;
    }
  }

  static async getActiveTableOrderByPhysicalTableId(
    physicalTableId: string
  ): Promise<TableOrder | null> {
    try {
      const response = await api.get(
        `/table-orders/physical-table/${physicalTableId}/active`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async getTableOrder(id: string): Promise<TableOrder> {
    const response = await api.get(`/table-orders/${id}`);
    return response.data;
  }

  static async closeTableOrder(id: string): Promise<TableOrder> {
    console.log("=== CLOSE TABLE ORDER DEBUG ===");
    console.log("Closing table order with ID:", id);

    const response = await api.put(`/table-orders/${id}/close`);

    console.log("Close table order response:", response.data);
    console.log("=== END CLOSE TABLE ORDER DEBUG ===");

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
