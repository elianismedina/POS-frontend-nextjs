import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableOrder } from "@/services/table-orders";
import { PhysicalTable } from "@/services/physical-tables";
import { Users, Clock, DollarSign, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PhysicalTableLayoutProps {
  tableOrders: TableOrder[];
  availablePhysicalTables: PhysicalTable[];
  onTableSelect?: (tableOrder: TableOrder) => void;
  onPhysicalTableSelect?: (physicalTable: PhysicalTable) => void;
}

interface TableWithStatus {
  id: string;
  tableNumber: string;
  tableName: string;
  capacity: number;
  location: string;
  status: "occupied" | "available";
  tableOrder?: TableOrder;
}

const TABLE_STATUS_COLORS = {
  active: "bg-green-500 border-green-600",
  closed: "bg-red-500 border-red-600",
  cancelled: "bg-yellow-500 border-yellow-600",
  available: "bg-blue-500 border-blue-600",
};

const TABLE_STATUS_LABELS = {
  active: "Activa",
  closed: "Cerrada",
  cancelled: "Cancelada",
  available: "Disponible",
};

export default function PhysicalTableLayout({
  tableOrders,
  availablePhysicalTables,
  onTableSelect,
  onPhysicalTableSelect,
}: PhysicalTableLayoutProps) {
  // Create a map of physical table IDs to their table orders
  const tableOrderMap = new Map<string, TableOrder>();
  tableOrders.forEach((order) => {
    if (order.physicalTableId) {
      tableOrderMap.set(order.physicalTableId, order);
    }
  });

  // Get occupied physical table IDs
  const occupiedTableIds = new Set(
    tableOrders
      .filter((order) => order.physicalTableId)
      .map((order) => order.physicalTableId!)
  );

  // Combine all physical tables (available + occupied)
  const allPhysicalTables: TableWithStatus[] = [
    // Only include available physical tables that are not occupied
    ...availablePhysicalTables
      .filter((table) => !occupiedTableIds.has(table.id))
      .map((table) => ({
        id: table.id,
        tableNumber: table.tableNumber,
        tableName: table.tableName || "Mesa",
        capacity: table.capacity || 0,
        location: table.location || "",
        status: "available" as const,
      })),
    // Include all occupied tables
    ...tableOrders
      .filter((order) => order.physicalTableId)
      .map((order) => ({
        id: order.physicalTableId!,
        tableNumber: order.tableNumber,
        tableName: order.tableName || "Mesa",
        capacity: order.numberOfCustomers,
        location: "", // We don't have location in table orders
        status: "occupied" as const,
        tableOrder: order,
      })),
  ];

  // Remove duplicates and sort by table number
  const uniqueTables = allPhysicalTables
    .filter(
      (table, index, self) => index === self.findIndex((t) => t.id === table.id)
    )
    .sort((a, b) => {
      const aNum = parseInt(a.tableNumber.replace(/\D/g, "")) || 0;
      const bNum = parseInt(b.tableNumber.replace(/\D/g, "")) || 0;
      return aNum - bNum;
    });

  const getTableStatus = (table: TableWithStatus) => {
    if (table.status === "occupied" && table.tableOrder) {
      const tableOrder = table.tableOrder;
      return {
        status: tableOrder.status,
        label:
          TABLE_STATUS_LABELS[
            tableOrder.status as keyof typeof TABLE_STATUS_LABELS
          ],
        color:
          TABLE_STATUS_COLORS[
            tableOrder.status as keyof typeof TABLE_STATUS_COLORS
          ],
      };
    }
    return {
      status: "available",
      label: "Disponible",
      color: TABLE_STATUS_COLORS.available,
    };
  };

  const handleTableClick = (table: TableWithStatus) => {
    if (table.status === "occupied" && table.tableOrder && onTableSelect) {
      onTableSelect(table.tableOrder);
    } else if (table.status === "available" && onPhysicalTableSelect) {
      // Find the original physical table
      const physicalTable = availablePhysicalTables.find(
        (pt) => pt.id === table.id
      );
      if (physicalTable) {
        onPhysicalTableSelect(physicalTable);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leyenda del Plano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full ${TABLE_STATUS_COLORS.active}`}
              ></div>
              <span className="text-sm">Activa</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full ${TABLE_STATUS_COLORS.available}`}
              ></div>
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full ${TABLE_STATUS_COLORS.closed}`}
              ></div>
              <span className="text-sm">Cerrada</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-4 h-4 rounded-full ${TABLE_STATUS_COLORS.cancelled}`}
              ></div>
              <span className="text-sm">Cancelada</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plano de Mesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {uniqueTables.map((table) => {
                const statusInfo = getTableStatus(table);
                const isClickable = onTableSelect || onPhysicalTableSelect;

                return (
                  <div
                    key={table.id}
                    className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                      isClickable ? "cursor-pointer hover:scale-105" : ""
                    } ${statusInfo.color}`}
                    onClick={() => isClickable && handleTableClick(table)}
                  >
                    {/* Table Number */}
                    <div className="text-center mb-2">
                      <h3 className="font-bold text-white text-lg">
                        {table.tableNumber}
                      </h3>
                      {table.tableName &&
                        table.tableName !== table.tableNumber && (
                          <p className="text-white text-xs opacity-90">
                            {table.tableName}
                          </p>
                        )}
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white/20 text-white border-white/30"
                      >
                        {statusInfo.label}
                      </Badge>
                    </div>

                    {/* Table Details */}
                    {table.status === "occupied" && table.tableOrder && (
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center gap-1 text-white text-xs">
                          <Users className="h-3 w-3" />
                          <span>
                            {table.tableOrder.numberOfCustomers} clientes
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-white text-xs">
                          <DollarSign className="h-3 w-3" />
                          <span>
                            {formatPrice(table.tableOrder.totalAmount)}
                          </span>
                        </div>
                        {table.tableOrder.orders &&
                          table.tableOrder.orders.length > 0 && (
                            <div className="flex items-center gap-1 text-white text-xs">
                              <Clock className="h-3 w-3" />
                              <span>
                                {table.tableOrder.orders.length} órdenes
                              </span>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Available Table Info */}
                    {table.status === "available" && (
                      <div className="space-y-1 mt-2">
                        {table.capacity > 0 && (
                          <div className="flex items-center gap-1 text-white text-xs">
                            <Users className="h-3 w-3" />
                            <span>Capacidad: {table.capacity}</span>
                          </div>
                        )}
                        {table.location && (
                          <div className="flex items-center gap-1 text-white text-xs">
                            <MapPin className="h-3 w-3" />
                            <span>{table.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Click indicator */}
                    {isClickable && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-1 h-1 bg-white/50 rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {uniqueTables.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No hay mesas configuradas</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Mesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">
              {uniqueTables.length}
            </div>
            <p className="text-xs text-gray-500">En el plano</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mesas Ocupadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {uniqueTables.filter((t) => t.status === "occupied").length}
            </div>
            <p className="text-xs text-gray-500">En uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mesas Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {uniqueTables.filter((t) => t.status === "available").length}
            </div>
            <p className="text-xs text-gray-500">Libres</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
