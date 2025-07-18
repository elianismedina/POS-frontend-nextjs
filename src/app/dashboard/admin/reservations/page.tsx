"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Calendar, Plus, Search, Filter, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReservationsService } from "@/app/services/reservations";
import { CustomersService } from "@/app/services/customers";
import { BranchesService } from "@/app/services/branches";
import { PhysicalTablesService } from "@/app/services/physical-tables";

interface Reservation {
  id: string;
  customerId: string;
  customerName?: string;
  branchId: string;
  branchName?: string;
  physicalTableId?: string;
  physicalTableNumber?: string;
  physicalTableName?: string;
  reservationTime: string;
  numberOfGuests: number;
  partySize?: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
}

export default function AdminReservationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/signin");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchReservations();
    }
  }, [user]);

  useEffect(() => {
    CustomersService.getCustomers().then((data) =>
      setCustomers(Array.isArray(data) ? data : [])
    );
    BranchesService.getBranches().then((data) =>
      setBranches(Array.isArray(data) ? data : [])
    );
    PhysicalTablesService.getAvailablePhysicalTables().then((data) =>
      setTables(Array.isArray(data) ? data : [])
    );
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const businessId = user?.business?.[0]?.id;
      if (businessId) {
        const reservations =
          await ReservationsService.getReservationsByBusiness(businessId);
        setReservations(reservations);
      } else {
        setReservations([]);
      }
    } catch (error) {
      console.error("Error fetching reservations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pendiente" },
      confirmed: { color: "bg-green-100 text-green-800", label: "Confirmada" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelada" },
      completed: { color: "bg-blue-100 text-blue-800", label: "Completada" },
    };
    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendiente",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Completada",
  };

  const mappedReservations = reservations.map((res) => ({
    ...res,
    numberOfGuests: res.numberOfGuests ?? res.partySize ?? 0,
    customerName:
      res.customerName ||
      (Array.isArray(customers)
        ? customers.find((c) => c.id === res.customerId)?.name
        : undefined) ||
      res.customerId,
    branchName:
      res.branchName ||
      (Array.isArray(branches)
        ? branches.find((b) => b.id === res.branchId)?.name
        : undefined) ||
      res.branchId,
    physicalTableNumber:
      res.physicalTableNumber ||
      (res.physicalTableId
        ? Array.isArray(tables)
          ? tables.find((t) => t.id === res.physicalTableId)?.tableNumber
          : undefined
        : null),
  }));

  const filteredReservations = mappedReservations.filter((reservation) => {
    const matchesSearch =
      reservation.customerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reservation.branchName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reservation.physicalTableNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || reservation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Cargando...</h2>
          <p className="text-muted-foreground">
            Por favor espera mientras cargamos las reservaciones
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 max-w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Gestión de Reservaciones</h1>
        <p className="text-muted-foreground">
          Administra las reservaciones de tu negocio
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por cliente, sucursal o mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push("/dashboard/admin/reservations/create")}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva Reservación
          </Button>
          <Button
            variant="outline"
            onClick={fetchReservations}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Cargando..." : "Actualizar"}
          </Button>
        </div>
      </div>

      {/* Reservations List */}
      <div className="grid gap-6">
        {filteredReservations.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No se encontraron reservaciones.
          </p>
        ) : (
          filteredReservations.map((reservation) => (
            <Card key={reservation.id}>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {reservation.customerName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {reservation.branchName} -{" "}
                    {reservation.physicalTableNumber
                      ? `Mesa ${reservation.physicalTableNumber.padStart(
                          2,
                          "0"
                        )}`
                      : "Sin mesa específica"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {reservation.reservationTime
                      ? new Date(reservation.reservationTime).toLocaleString(
                          "es-CO",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          }
                        )
                      : "-"}
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    {reservation.numberOfGuests} invitados
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-800">
                    {statusLabels[reservation.status] || reservation.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Creado:{" "}
                  {reservation.createdAt &&
                  !isNaN(new Date(reservation.createdAt).getTime())
                    ? new Date(reservation.createdAt).toLocaleDateString()
                    : "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Actualizado:{" "}
                  {reservation.updatedAt &&
                  !isNaN(new Date(reservation.updatedAt).getTime())
                    ? new Date(reservation.updatedAt).toLocaleDateString()
                    : "-"}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
