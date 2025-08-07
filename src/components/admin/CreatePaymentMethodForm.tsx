"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import {
  paymentMethodsService,
  CreatePaymentMethodData,
} from "@/app/services/payment-methods";

interface CreatePaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreatePaymentMethodForm({
  onSuccess,
  onCancel,
}: CreatePaymentMethodFormProps) {
  const [formData, setFormData] = useState<CreatePaymentMethodData>({
    name: "",
    code: "",
    description: "",
    isActive: true,
    requiresConfirmation: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      alert("Name and code are required");
      return;
    }

    try {
      setLoading(true);
      await paymentMethodsService.create(formData);
      onSuccess();
    } catch (error) {
      console.error("Error creating payment method:", error);
      alert("Failed to create payment method");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof CreatePaymentMethodData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl sm:text-2xl">
            Create Payment Method
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 hover:bg-blue-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-sm font-medium">
              Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Credit Card, Cash, Mobile Payment"
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="code" className="text-sm font-medium">
              Code *
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                handleInputChange("code", e.target.value.toUpperCase())
              }
              placeholder="e.g., CREDIT_CARD, CASH, MOBILE"
              required
              className="h-12 text-base font-mono"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Optional description of the payment method"
              rows={4}
              className="text-base resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div className="space-y-1">
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Active
                </Label>
                <div className="text-xs text-muted-foreground">
                  Enable this payment method for use
                </div>
              </div>
              <Switch
                checked={formData.isActive || false}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
                className="data-[state=checked]:bg-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
              <div className="space-y-1">
                <Label
                  htmlFor="requiresConfirmation"
                  className="text-sm font-medium"
                >
                  Requires Confirmation
                </Label>
                <div className="text-xs text-muted-foreground">
                  Require manager approval for this payment method
                </div>
              </div>
              <Switch
                checked={formData.requiresConfirmation || false}
                onCheckedChange={(checked) =>
                  handleInputChange("requiresConfirmation", checked)
                }
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
          </div>

          {/* Mobile-first button layout */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto h-12 text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto h-12 text-base"
            >
              {loading ? "Creating..." : "Create Payment Method"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
