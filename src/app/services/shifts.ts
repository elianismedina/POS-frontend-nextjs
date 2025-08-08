import { api } from "@/lib/api";

export interface Shift {
  id: string;
  cashierId: string;
  startTime: string;
  endTime?: string;
  initialAmount: number;
  finalAmount?: number;
  totalSales?: number;
  totalOrders?: number;
  status: "ACTIVE" | "ENDED";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartShiftRequest {
  cashierId: string;
  initialAmount: number;
}

export interface EndShiftRequest {
  finalAmount: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedShiftsResponse {
  shifts: Shift[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const shiftsService = {
  async startShift(data: StartShiftRequest): Promise<Shift> {
    const response = await api.post("/register-shifts", data);
    return response.data;
  },

  async endShift(shiftId: string, data: EndShiftRequest): Promise<Shift> {
    const response = await api.put(`/register-shifts/${shiftId}/end`, data);
    return response.data;
  },

  async getActiveShift(cashierId: string): Promise<Shift | null> {
    try {
      const response = await api.get(
        `/register-shifts/cashier/${cashierId}/active`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  async getShiftsByCashier(
    cashierId: string,
    params?: PaginationParams
  ): Promise<PaginatedShiftsResponse> {
    const queryParams = new URLSearchParams();

    if (params) {
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.limit) queryParams.append("limit", params.limit.toString());
    }

    const response = await api.get(
      `/register-shifts/cashier/${cashierId}?${queryParams.toString()}`
    );

    return response.data;
  },

  async getSalesByPaymentMethod(shiftId: string): Promise<any> {
    const response = await api.get(
      `/register-shifts/${shiftId}/sales-by-payment-method`
    );
    return response.data;
  },

  async getActiveShifts(): Promise<Shift[]> {
    const response = await api.get("/register-shifts/active");
    return response.data;
  },
};
