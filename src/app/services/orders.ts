import { api } from "@/lib/api";
import { paymentsService, CreatePaymentRequest } from "./payments";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxes: Array<{
    id: string;
    name: string;
    rate: number;
    amount: number;
  }>;
}

export interface Order {
  id: string;
  businessId: string;
  cashierId: string;
  customerId?: string;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  _props?: {
    id: string;
    businessId: string;
    cashierId: string;
    customerId?: string;
    items: OrderItem[];
    total: number;
    totalAmount: number;
    taxAmount: number;
    finalAmount: number;
    status: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface CreateOrderRequest {
  businessId: string;
  cashierId: string;
  customerId?: string;
  notes?: string;
}

export interface AddItemRequest {
  barcode: string;
  quantity?: number;
  taxes?: Array<{
    taxId: string;
  }>;
}

export interface CompleteOrderRequest {
  completionType: "PICKUP" | "DELIVERY";
  deliveryAddress?: string;
  estimatedTime?: string;
  notes?: string;
}

export interface GetOrdersRequest {
  businessId: string;
  cashierId?: string;
  status?: string;
}

class OrdersService {
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await api.post("/orders", data);
    return response.data;
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  }

  async getOrders(params: GetOrdersRequest): Promise<Order[]> {
    const queryParams = new URLSearchParams();
    queryParams.append("businessId", params.businessId);
    if (params.cashierId) {
      queryParams.append("cashierId", params.cashierId);
    }
    if (params.status) {
      queryParams.append("status", params.status);
    }

    const response = await api.get(`/orders?${queryParams.toString()}`);
    return response.data;
  }

  async addItem(orderId: string, data: AddItemRequest): Promise<Order> {
    const response = await api.post(`/orders/${orderId}/items`, data);
    return response.data;
  }

  async updateItemQuantity(
    orderId: string,
    itemId: string,
    quantity: number
  ): Promise<Order> {
    const response = await api.patch(
      `/orders/${orderId}/items/${itemId}/quantity`,
      { quantity }
    );
    return response.data;
  }

  async removeItem(orderId: string, itemId: string): Promise<Order> {
    const response = await api.delete(`/orders/${orderId}/items/${itemId}`);
    return response.data;
  }

  async updateOrder(
    orderId: string,
    data: Partial<CreateOrderRequest>
  ): Promise<Order> {
    const response = await api.patch(`/orders/${orderId}`, data);
    return response.data;
  }

  async completeOrder(
    orderId: string,
    data: CompleteOrderRequest
  ): Promise<Order> {
    const response = await api.post(`/orders/${orderId}/complete`, data);
    return response.data;
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  }

  async processPayment(data: CreatePaymentRequest): Promise<any> {
    return await paymentsService.createPayment(data);
  }
}

export const ordersService = new OrdersService();
