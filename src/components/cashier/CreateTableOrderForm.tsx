"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  TableOrdersService,
  CreateTableOrderDto,
} from "@/services/table-orders";

interface CreateTableOrderFormProps {
  businessId: string;
  branchId: string;
  onSuccess?: (tableOrder: any) => void;
  onCancel?: () => void;
}

export function CreateTableOrderForm({
  businessId,
  branchId,
  onSuccess,
  onCancel,
}: CreateTableOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTableOrderDto>({
    tableNumber: "",
    tableName: "",
    notes: "",
    numberOfCustomers: 0,
    businessId,
    branchId,
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tableOrder = await TableOrdersService.createTableOrder(formData);
      toast({
        title: "Mesa creada exitosamente",
        description: `La mesa ${tableOrder.tableNumber} ha sido creada.`,
      });
      onSuccess?.(tableOrder);
    } catch (error) {
      console.error("Error creating table order:", error);
      toast({
        title: "Error al crear mesa",
        description: "Hubo un problema al crear la mesa. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CreateTableOrderDto,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Crear Nueva Mesa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tableNumber">Número de Mesa *</Label>
            <Input
              id="tableNumber"
              value={formData.tableNumber}
              onChange={(e) => handleInputChange("tableNumber", e.target.value)}
              placeholder="Ej: Mesa 1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tableName">Nombre de Mesa (Opcional)</Label>
            <Input
              id="tableName"
              value={formData.tableName}
              onChange={(e) => handleInputChange("tableName", e.target.value)}
              placeholder="Ej: Mesa de la Ventana"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfCustomers">Número de Clientes</Label>
            <Input
              id="numberOfCustomers"
              type="number"
              min="0"
              value={formData.numberOfCustomers}
              onChange={(e) =>
                handleInputChange(
                  "numberOfCustomers",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Notas adicionales sobre la mesa..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.tableNumber}
              className="flex-1"
            >
              {isLoading ? "Creando..." : "Crear Mesa"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
