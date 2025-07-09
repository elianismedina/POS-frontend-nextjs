import { api } from "@/lib/api";

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  requiresConfirmation: boolean;
  createdAt: string;
  updatedAt: string;
  _props?: {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    requiresConfirmation: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface CreatePaymentMethodData {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  requiresConfirmation?: boolean;
}

export interface UpdatePaymentMethodData {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  requiresConfirmation?: boolean;
}

export const paymentMethodsService = {
  async getAll(): Promise<PaymentMethod[]> {
    console.log("Fetching payment methods...");
    const response = await api.get("/payment-methods");
    console.log("Payment methods response:", response.data);

    // Normalize the data to handle both serialized and raw entity formats
    return response.data.map((method: any) => {
      if (method._props) {
        // Convert from raw entity format to normalized format
        return {
          id: method._props.id,
          name: method._props.name,
          code: method._props.code,
          description: method._props.description,
          isActive: method._props.isActive,
          requiresConfirmation: method._props.requiresConfirmation,
          createdAt:
            method._props.createdAt?.toISOString?.() || method._props.createdAt,
          updatedAt:
            method._props.updatedAt?.toISOString?.() || method._props.updatedAt,
        };
      }
      return method;
    });
  },

  async getById(id: string): Promise<PaymentMethod> {
    const response = await api.get(`/payment-methods/${id}`);
    return response.data;
  },

  async create(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    const response = await api.post("/payment-methods", data);
    return response.data;
  },

  async update(
    id: string,
    data: UpdatePaymentMethodData
  ): Promise<PaymentMethod> {
    const response = await api.put(`/payment-methods/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/payment-methods/${id}`);
  },

  async toggleActive(id: string, isActive: boolean): Promise<PaymentMethod> {
    const response = await api.patch(`/payment-methods/${id}/toggle`, {
      isActive,
    });
    return response.data;
  },
};
