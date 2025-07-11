import { api } from "@/lib/api";

export interface Payment {
  id: string;
  orderId: string;
  paymentMethodId: string;
  paymentMethod: {
    id: string;
    name: string;
    code: string;
  };
  amount: number;
  amountTendered?: number;
  transactionReference?: string;
  notes?: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentRequest {
  orderId: string;
  paymentMethodId: string;
  amount: number;
  metadata?: Record<string, unknown>;
}

class PaymentsService {
  async createPayment(data: CreatePaymentRequest): Promise<Payment> {
    // Use the correct endpoint that matches the backend controller
    const response = await api.post("/payments/process", data);
    return response.data;
  }

  async getPayment(paymentId: string): Promise<Payment> {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  }

  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: Payment["status"]
  ): Promise<Payment> {
    const response = await api.patch(`/payments/${paymentId}/status`, {
      status,
    });
    return response.data;
  }

  async refundPayment(paymentId: string, amount?: number): Promise<Payment> {
    const response = await api.post(`/payments/${paymentId}/refund`, {
      amount,
    });
    return response.data;
  }
}

export const paymentsService = new PaymentsService();
