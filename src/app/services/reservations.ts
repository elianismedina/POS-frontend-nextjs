import { api } from "@/lib/api";

export interface Reservation {
  id: string;
  customerId: string;
  customerName?: string;
  branchId: string;
  branchName?: string;
  physicalTableId?: string;
  physicalTableName?: string;
  reservationTime: string;
  numberOfGuests: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDto {
  customerId: string;
  branchId: string;
  physicalTableId?: string;
  reservationTime: string;
  numberOfGuests: number;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
}

export interface UpdateReservationDto {
  customerId?: string;
  branchId?: string;
  physicalTableId?: string;
  reservationTime?: string;
  numberOfGuests?: number;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
}

export class ReservationsService {
  static async getReservations(): Promise<Reservation[]> {
    const response = await api.get("/reservations");
    return response.data;
  }

  static async getReservation(id: string): Promise<Reservation> {
    const response = await api.get(`/reservations/${id}`);
    return response.data;
  }

  static async createReservation(
    data: CreateReservationDto
  ): Promise<Reservation> {
    const response = await api.post("/reservations", data);
    return response.data;
  }

  static async updateReservation(
    id: string,
    data: UpdateReservationDto
  ): Promise<Reservation> {
    const response = await api.put(`/reservations/${id}`, data);
    return response.data;
  }

  static async deleteReservation(id: string): Promise<void> {
    await api.delete(`/reservations/${id}`);
  }

  static async getReservationsByBusiness(
    businessId: string
  ): Promise<Reservation[]> {
    const response = await api.get(`/reservations/business/${businessId}`);
    return response.data;
  }

  static async getReservationsByBranch(
    branchId: string
  ): Promise<Reservation[]> {
    const response = await api.get(`/reservations/branch/${branchId}`);
    return response.data;
  }

  static async getReservationsByCustomer(
    customerId: string
  ): Promise<Reservation[]> {
    const response = await api.get(`/reservations/customer/${customerId}`);
    return response.data;
  }

  static async updateReservationStatus(
    id: string,
    status: "pending" | "confirmed" | "cancelled" | "completed"
  ): Promise<Reservation> {
    const response = await api.patch(`/reservations/${id}/status`, { status });
    return response.data;
  }
}
