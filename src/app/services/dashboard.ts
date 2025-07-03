import { api } from "@/lib/api";

export interface DashboardStats {
  todaySales: number;
  pendingOrders: number;
  totalSales: number;
  todayOrders: number;
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
}

export const dashboardService = new DashboardService();
