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
            Mesas Activas ({tables.length})
          </h3>
          <Badge variant="secondary" className="text-xs">
            {tables.filter((t) => t.status === "active").length} activas
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
        {tables.map((table) => (
          <Card
            key={table.id}
            className="transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] border-2 hover:border-blue-200"
            onClick={() => {
              console.log("=== CARD CLICKED ===");
              console.log("Table being selected:", table);
              console.log("onTableSelect function:", onTableSelect);
              onTableSelect(table);
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl font-bold text-blue-700">
                    {table.tableNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg text-gray-900">
                      {table.tableName || `Mesa ${table.tableNumber}`}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {formatDate(table.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <Badge className={getTableStatusColor(table.status)}>
                  {getTableStatusText(table.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Customer Information */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Clientes:</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {table.numberOfCustomers}
                  </span>
                </div>

                {/* Total Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Total:</span>
                  </div>
                  <span className="font-bold text-lg text-green-600">
                    {formatPrice(table.totalAmount)}
                  </span>
                </div>

                {/* Orders Count */}
                {table.orders && table.orders.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Pedidos:</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {table.orders.length}
                    </span>
                  </div>
                )}

                {/* Notes */}
                {table.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-md">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          Notas:
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {table.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("=== BUTTON CLICKED ===");
                      console.log("Table being selected:", table);
                      console.log("onTableSelect function:", onTableSelect);
                      onTableSelect(table);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Mesa
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(table);
                    }}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
