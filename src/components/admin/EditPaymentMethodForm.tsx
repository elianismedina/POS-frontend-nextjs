"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import {
  paymentMethodsService,
  PaymentMethod,
  UpdatePaymentMethodData,
} from "@/app/services/payment-methods";

interface EditPaymentMethodFormProps {
  paymentMethod: PaymentMethod;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditPaymentMethodForm({
  paymentMethod,
  onSuccess,
  onCancel,
}: EditPaymentMethodFormProps) {
  const [formData, setFormData] = useState<UpdatePaymentMethodData>({
    name: "",
    code: "",
    description: "",
    isActive: true,
    requiresConfirmation: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData({
      name: paymentMethod.name,
      code: paymentMethod.code,
      description: paymentMethod.description || "",
      isActive: paymentMethod.isActive,
      requiresConfirmation: paymentMethod.requiresConfirmation,
    });
  }, [paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name?.trim() || !formData.code?.trim()) {
      alert("Name and code are required");
      return;
    }

    try {
      setLoading(true);
      await paymentMethodsService.update(paymentMethod.id, formData);
      onSuccess();
    } catch (error) {
      console.error("Error updating payment method:", error);
      alert("Failed to update payment method");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof UpdatePaymentMethodData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Edit Payment Method</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Credit Card, Cash, Mobile Payment"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Code *</Label>
            <Input
              id="code"
              value={formData.code || ""}
              onChange={(e) =>
                handleInputChange("code", e.target.value.toUpperCase())
              }
              placeholder="e.g., CREDIT_CARD, CASH, MOBILE"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Optional description of the payment method"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label htmlFor="isActive">Active</Label>
              <div className="text-sm text-muted-foreground">
                Enable this payment method for use
              </div>
            </div>
            <Switch
              checked={formData.isActive || false}
              onCheckedChange={(checked) =>
                handleInputChange("isActive", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label htmlFor="requiresConfirmation">
                Requires Confirmation
              </Label>
              <div className="text-sm text-muted-foreground">
                Require manager approval for this payment method
              </div>
            </div>
            <Switch
              checked={formData.requiresConfirmation || false}
              onCheckedChange={(checked) =>
                handleInputChange("requiresConfirmation", checked)
              }
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Payment Method"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
