import { api } from "@/lib/api";

export interface BusinessPaymentMethod {
  id: string;
  businessId: string;
  paymentMethodId: string;
  paymentMethod: {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    requiresConfirmation: boolean;
  };
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class BusinessPaymentMethodsService {
  async getBusinessPaymentMethods(): Promise<BusinessPaymentMethod[]> {
    const response = await api.get("/business-payment-methods/my-business");
    return response.data;
  }

  async getDefaultPaymentMethod(): Promise<BusinessPaymentMethod | null> {
    const response = await api.get(
      "/business-payment-methods/my-business/default"
    );
    return response.data;
  }
}

export const businessPaymentMethodsService =
  new BusinessPaymentMethodsService();
