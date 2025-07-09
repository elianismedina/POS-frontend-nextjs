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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Métodos de Pago</h2>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Método de Pago
        </Button>
      </div>

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {paymentMethods.map((method, index) => (
          <Card key={method.id || `payment-method-${index}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{method.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{method.code}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={method.isActive}
                    onCheckedChange={() => handleToggleActive(method)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingMethod(method)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(method)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {method.description && (
                <p className="text-sm text-muted-foreground mb-3">
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

      {paymentMethods.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">
              No payment methods found
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
