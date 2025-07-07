"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { TableOrder } from "@/services/table-orders";
import { formatPrice } from "@/lib/utils";
import {
  Users,
  DollarSign,
  Receipt,
  FileText,
  Eye,
  Info,
  RefreshCw,
  Clock,
} from "lucide-react";

interface ExistingTablesDisplayProps {
  tables: TableOrder[];
  isLoading: boolean;
  onTableSelect: (tableOrder: TableOrder) => void;
  onRefresh: () => void;
  onViewDetails: (tableOrder: TableOrder) => void;
}

export function ExistingTablesDisplay({
  tables,
  isLoading,
  onTableSelect,
  onRefresh,
  onViewDetails,
}: ExistingTablesDisplayProps) {
  const { toast } = useToast();
  const [selectedMesaOrders, setSelectedMesaOrders] = useState<
    TableOrder[] | null
  >(null);

  // Agrupar por mesa física y calcular totales agregados
  const groupedByMesa = tables.reduce(
    (acc: Record<string, TableOrder[]>, order) => {
      const key = order.physicalTableId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    },
    {}
  );

  // Crear objetos agregados para cada mesa física
  const mesasAgregadas = Object.entries(groupedByMesa).map(
    ([physicalTableId, orders]) => {
      const mesa = orders[0]; // Usar la primera orden como referencia para datos de la mesa
      const totalAmount = orders.reduce(
        (sum, order) => sum + (order.totalAmount || 0),
        0
      );
      const totalCustomers = orders.reduce(
        (sum, order) => sum + (order.numberOfCustomers || 0),
        0
      );
      const activeOrders = orders.filter(
        (order) => order.status === "active"
      ).length;

      return {
        physicalTableId,
        tableNumber: mesa.tableNumber,
        tableName: mesa.tableName,
        status: mesa.status,
        createdAt: mesa.createdAt,
        totalAmount,
        totalCustomers,
        activeOrders,
        orders, // Mantener todas las órdenes para el modal
      };
    }
  );

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getTableStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activa";
      case "closed":
        return "Cerrada";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-48 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Receipt className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay mesas activas
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          No se encontraron mesas activas en este momento.
        </p>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Mesas Activas ({mesasAgregadas.length})
          </h3>
          <Badge variant="secondary" className="text-xs">
            {mesasAgregadas.filter((m) => m.status === "active").length} activas
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
        {mesasAgregadas.map((mesa) => (
          <Card
            key={mesa.physicalTableId}
            className="transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] border-2 hover:border-blue-200"
            onClick={() => setSelectedMesaOrders(mesa.orders)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-700">
                    {mesa.tableNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-900">
                      {mesa.tableName || `Mesa ${mesa.tableNumber}`}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {mesa.orders.length} orden
                        {mesa.orders.length > 1 ? "es" : ""} activa
                        {mesa.orders.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <Badge className={getTableStatusColor(mesa.status)}>
                  {getTableStatusText(mesa.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Total Clientes:
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {mesa.totalCustomers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Total General:
                    </span>
                  </div>
                  <span className="font-bold text-lg text-green-600">
                    {formatPrice(mesa.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Órdenes activas:
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {mesa.activeOrders}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal para seleccionar una orden activa de la mesa */}
      {selectedMesaOrders && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[400px] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Selecciona una orden activa para la mesa{" "}
              {selectedMesaOrders[0].tableNumber}
            </h3>
            <ul className="space-y-3">
              {selectedMesaOrders.map((order) => (
                <li
                  key={order.id}
                  className="border rounded p-3 flex flex-col gap-1 hover:bg-blue-50 cursor-pointer"
                  onClick={() => {
                    onTableSelect(order);
                    setSelectedMesaOrders(null);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900">
                      Orden #{order.id.slice(-6)}
                    </span>
                    <Badge className={getTableStatusColor(order.status)}>
                      {getTableStatusText(order.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Users className="h-3 w-3" /> {order.numberOfCustomers}{" "}
                    clientes
                    <DollarSign className="h-3 w-3 ml-2" />{" "}
                    {formatPrice(order.totalAmount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Creada: {formatDate(order.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setSelectedMesaOrders(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
