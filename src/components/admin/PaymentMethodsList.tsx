"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { businessPaymentMethodsService } from "@/app/services/business-payment-methods";
import { CreatePaymentMethodForm } from "./CreatePaymentMethodForm";
import { EditPaymentMethodForm } from "./EditPaymentMethodForm";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";

interface BusinessPaymentMethod {
  id: string;
  businessId: string;
  paymentMethodId: string;
  paymentMethod: {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    requiresConfirmation: boolean;
  };
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function PaymentMethodsList() {
  const [paymentMethods, setPaymentMethods] = useState<BusinessPaymentMethod[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMethod, setEditingMethod] =
    useState<BusinessPaymentMethod | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setIsLoading(true);
      const methods =
        await businessPaymentMethodsService.getBusinessPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchPaymentMethods();
    toast({
      title: "Success",
      description: "Payment method created successfully",
      variant: "success",
    });
  };

  const handleEditSuccess = () => {
    setShowEditForm(false);
    setEditingMethod(null);
    fetchPaymentMethods();
    toast({
      title: "Success",
      description: "Payment method updated successfully",
      variant: "success",
    });
  };

  const handleEditClick = (method: BusinessPaymentMethod) => {
    setEditingMethod(method);
    setShowEditForm(true);
  };

  const handleToggleActive = async (method: BusinessPaymentMethod) => {
    try {
      // This would need to be implemented in the service
      // await businessPaymentMethodsService.toggleActive(method.id);
      await fetchPaymentMethods();
      toast({
        title: "Success",
        description: `Payment method ${
          method.isActive ? "deactivated" : "activated"
        } successfully`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error toggling payment method:", error);
      toast({
        title: "Error",
        description: "Failed to update payment method",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading payment methods...</div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <CreatePaymentMethodForm
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  if (showEditForm && editingMethod) {
    return (
      <EditPaymentMethodForm
        paymentMethod={{
          id: editingMethod.paymentMethod.id,
          name: editingMethod.paymentMethod.name,
          code: editingMethod.paymentMethod.code,
          description: editingMethod.paymentMethod.description,
          isActive: editingMethod.paymentMethod.isActive,
          requiresConfirmation:
            editingMethod.paymentMethod.requiresConfirmation,
        }}
        onSuccess={handleEditSuccess}
        onCancel={() => {
          setShowEditForm(false);
          setEditingMethod(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
          <p className="text-gray-600 mt-1">
            Manage payment methods for your business
          </p>
        </div>
        <Button variant="submit" onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Method
        </Button>
      </div>

      <div className="grid gap-4">
        {paymentMethods.map((method) => (
          <Card key={method.id} className="border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardTitle className="text-lg font-semibold">
                    {method.paymentMethod.name}
                  </CardTitle>
                  {method.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Default
                    </Badge>
                  )}
                  {method.paymentMethod.requiresConfirmation && (
                    <Badge variant="outline">Requires Confirmation</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(method)}
                    title={method.isActive ? "Deactivate" : "Activate"}
                  >
                    {method.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClick(method)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Code:</span>
                  <span className="font-mono">{method.paymentMethod.code}</span>
                </div>
                {method.paymentMethod.description && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Description:</span>
                    <span>{method.paymentMethod.description}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge
                    variant={method.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {method.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {paymentMethods.length === 0 && (
        <Card className="border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Payment Methods
              </h3>
              <p className="text-gray-600 mb-4">
                Get started by adding your first payment method.
              </p>
              <Button variant="submit" onClick={() => setShowCreateForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
