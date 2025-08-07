"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  paymentMethodsService,
  PaymentMethod,
} from "@/app/services/payment-methods";
import { CreatePaymentMethodForm } from "./CreatePaymentMethodForm";
import { EditPaymentMethodForm } from "./EditPaymentMethodForm";

export function PaymentMethodsList() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null
  );
  const { toast } = useToast();

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentMethodsService.getAll();
      console.log("Loaded payment methods:", methods);
      setPaymentMethods(methods);
    } catch (error) {
      console.error("Error loading payment methods:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los métodos de pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      await paymentMethodsService.toggleActive(method.id, !method.isActive);
      await loadPaymentMethods();
      toast({
        title: "Éxito",
        description: `Método de pago ${
          method.isActive ? "desactivado" : "activado"
        } exitosamente`,
      });
    } catch (error) {
      console.error("Error toggling payment method:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del método de pago",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${method.name}"?`)) {
      return;
    }

    try {
      await paymentMethodsService.delete(method.id);
      await loadPaymentMethods();
      toast({
        title: "Éxito",
        description: "Método de pago eliminado exitosamente",
      });
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el método de pago",
        variant: "destructive",
      });
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    loadPaymentMethods();
    toast({
      title: "Éxito",
      description: "Método de pago creado exitosamente",
    });
  };

  const handleEditSuccess = () => {
    setEditingMethod(null);
    loadPaymentMethods();
    toast({
      title: "Éxito",
      description: "Método de pago actualizado exitosamente",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading payment methods...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Métodos de Pago
          </h2>
          <p className="mt-1 text-sm text-gray-500 sm:text-base">
            Manage payment methods for your business
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="w-full sm:w-auto px-6 py-3 text-base"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Método de Pago
        </Button>
      </div>

      {/* Forms */}
      {showCreateForm && (
        <CreatePaymentMethodForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingMethod && (
        <EditPaymentMethodForm
          paymentMethod={editingMethod}
          onSuccess={handleEditSuccess}
          onCancel={() => setEditingMethod(null)}
        />
      )}

      {/* Payment Methods Grid - Mobile Single Column, Desktop Multi-column */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paymentMethods.map((method, index) => (
          <Card
            key={method.id || `payment-method-${index}`}
            className="hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-xl truncate">
                    {method.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {method.code}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Switch
                    checked={method.isActive}
                    onCheckedChange={() => handleToggleActive(method)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingMethod(method)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(method)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {method.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {method.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant={method.isActive ? "default" : "secondary"}>
                  {method.isActive ? "Active" : "Inactive"}
                </Badge>
                {method.requiresConfirmation && (
                  <Badge variant="outline">Requires Confirmation</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {paymentMethods.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No payment methods found
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Get started by adding your first payment method
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Payment Method
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
