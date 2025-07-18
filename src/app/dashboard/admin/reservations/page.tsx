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

interface Reservation {
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

export default function AdminReservationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  const fetchReservations = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockReservations: Reservation[] = [
        {
          id: "1",
          customerId: "customer-1",
          customerName: "Juan Pérez",
          branchId: "branch-1",
          branchName: "Sucursal Centro",
          physicalTableId: "table-1",
          physicalTableName: "Mesa 1",
          reservationTime: "2024-12-25T19:00:00.000Z",
          numberOfGuests: 4,
          status: "pending",
          createdAt: "2024-12-20T10:00:00.000Z",
          updatedAt: "2024-12-20T10:00:00.000Z",
        },
        {
          id: "2",
          customerId: "customer-2",
          customerName: "María García",
          branchId: "branch-1",
          branchName: "Sucursal Centro",
          reservationTime: "2024-12-26T20:00:00.000Z",
          numberOfGuests: 6,
          status: "confirmed",
          createdAt: "2024-12-19T15:30:00.000Z",
          updatedAt: "2024-12-19T15:30:00.000Z",
        },
      ];
      setReservations(mockReservations);
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

  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.customerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reservation.branchName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      reservation.physicalTableName
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
            variant="outline"
            onClick={fetchReservations}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
          <Button
            onClick={() => router.push("/dashboard/admin/reservations/create")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reservación
          </Button>
        </div>
      </div>

      {/* Reservations List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando reservaciones...</p>
          </div>
        ) : filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No hay reservaciones
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "No se encontraron reservaciones con los filtros aplicados"
                  : "Aún no hay reservaciones registradas"}
              </p>
              <Button
                onClick={() =>
                  router.push("/dashboard/admin/reservations/create")
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Reservación
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredReservations.map((reservation) => (
            <Card
              key={reservation.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">
                        {reservation.customerName || "Cliente"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {reservation.branchName}
                        {reservation.physicalTableName &&
                          ` - ${reservation.physicalTableName}`}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(reservation.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Fecha y Hora
                    </p>
                    <p className="text-sm">
                      {new Date(reservation.reservationTime).toLocaleDateString(
                        "es-ES",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Número de Personas
                    </p>
                    <p className="text-sm">
                      {reservation.numberOfGuests} personas
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Creada
                    </p>
                    <p className="text-sm">
                      {new Date(reservation.createdAt).toLocaleDateString(
                        "es-ES"
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/admin/reservations/${reservation.id}`
                        )
                      }
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
