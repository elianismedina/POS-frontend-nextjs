"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { CreateTableOrderForm } from "@/components/cashier/CreateTableOrderForm";
import { TableOrdersList } from "@/components/cashier/TableOrdersList";
import { TableOrder } from "@/services/table-orders";
import { useAuth } from "@/lib/auth/AuthContext";

export default function TablesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableOrder | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const businessId = user?.business?.[0]?.id || "";
  const branchId = user?.branch?.id || "";

  const handleCreateSuccess = (tableOrder: TableOrder) => {
    setShowCreateForm(false);
    toast({
      title: "Mesa creada exitosamente",
      description: `La mesa ${tableOrder.tableNumber} ha sido creada.`,
    });
  };

  const handleTableSelect = (tableOrder: TableOrder) => {
    setSelectedTable(tableOrder);
    // TODO: Navigate to table detail page or open modal
    toast({
      title: "Mesa seleccionada",
      description: `Has seleccionado la mesa ${tableOrder.tableNumber}.`,
    });
  };

  if (!businessId || !branchId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No se pudo cargar la información del negocio.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Mesas</h1>
          <p className="text-gray-600 mt-2">
            Administra las mesas y órdenes de mesa para tu negocio
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          Crear Nueva Mesa
        </Button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <CreateTableOrderForm
              businessId={businessId}
              branchId={branchId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mesas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500">Mesas en uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-gray-500">En mesas activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500">En mesas activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500">Órdenes activas</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <TableOrdersList
          businessId={businessId}
          branchId={branchId}
          onTableSelect={handleTableSelect}
        />
      </div>

      {selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Mesa {selectedTable.tableNumber}
              </h2>
              <Button variant="outline" onClick={() => setSelectedTable(null)}>
                Cerrar
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Estado
                  </label>
                  <p className="text-lg">{selectedTable.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Clientes
                  </label>
                  <p className="text-lg">{selectedTable.numberOfCustomers}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Total
                  </label>
                  <p className="text-lg font-semibold">
                    ${selectedTable.totalAmount}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Órdenes
                  </label>
                  <p className="text-lg">{selectedTable.orders?.length || 0}</p>
                </div>
              </div>
              {selectedTable.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Notas
                  </label>
                  <p className="text-sm">{selectedTable.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1">Ver Órdenes</Button>
                <Button variant="outline">Editar Mesa</Button>
                <Button variant="destructive">Cerrar Mesa</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
