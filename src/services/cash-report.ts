import { api } from "@/lib/api";

export interface CashReport {
  shiftId: string;
  cashierId: string;
  startTime: Date;
  endTime?: Date;
  startingCash: number;
  endingCash?: number;
  totalSales: number;
  totalOrders: number;
  status: "ACTIVE" | "CLOSED";
  cashDifference?: number;
  salesByPaymentMethod: {
    method: string;
    amount: number;
  }[];
}

export const cashReportService = {
  async getCashReport(shiftId: string): Promise<CashReport> {
    const response = await api.get(`/register-shifts/${shiftId}/cash-report`);
    return response.data;
  },
};
