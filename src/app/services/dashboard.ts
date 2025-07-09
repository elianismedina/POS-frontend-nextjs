import { api } from "@/lib/api";

export interface DashboardStats {
  todaySales: number;
  pendingOrders: number;
  totalSales: number;
  todayOrders: number;
}

export interface HistoricalSalesData {
  name: string;
  sales: number;
}

class DashboardService {
  async getDashboardStats(
    businessId: string,
    cashierId?: string
  ): Promise<DashboardStats> {
    const params = new URLSearchParams({ businessId });
    if (cashierId) {
      params.append("cashierId", cashierId);
    }

    const response = await api.get(
      `/orders/stats/dashboard?${params.toString()}`
    );
    return response.data;
  }

  async getHistoricalSales(
    businessId: string,
    period: "week" | "month" | "year",
    cashierId?: string
  ): Promise<HistoricalSalesData[]> {
    const params = new URLSearchParams({
      businessId,
      period,
    });
    if (cashierId) {
      params.append("cashierId", cashierId);
    }

    console.log("Calling historical sales API with params:", params.toString());
    const response = await api.get(
      `/orders/stats/historical-sales?${params.toString()}`
    );
    console.log("Historical sales API response:", response.data);
    return response.data;
  }

  async testOrders(businessId: string) {
    console.log("Testing orders API for business:", businessId);
    const response = await api.get(
      `/orders/stats/test-orders?businessId=${businessId}`
    );
    console.log("Test orders API response:", response.data);
    return response.data;
  }

  async testDateCalculations(businessId: string) {
    console.log("Testing date calculations for business:", businessId);
    const response = await api.get(
      `/orders/stats/test-date-calculations?businessId=${businessId}`
    );
    console.log("Date calculations test response:", response.data);
    return response.data;
  }
}

export const dashboardService = new DashboardService();
