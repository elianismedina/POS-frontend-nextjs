"use client";

import React from "react";
import {
  FormikForm,
  FormikInput,
  FormikTextarea,
  FormikSwitch,
} from "@/components/shared/FormikForm";
import { paymentMethodSchema } from "@/lib/validation-schemas";
import {
  paymentMethodsService,
  UpdatePaymentMethodData,
} from "@/app/services/payment-methods";
import { useToast } from "@/components/ui/use-toast";

interface EditPaymentMethodFormProps {
  paymentMethod: {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive: boolean;
    requiresConfirmation: boolean;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditPaymentMethodForm({
  paymentMethod,
  onSuccess,
  onCancel,
}: EditPaymentMethodFormProps) {
  const { toast } = useToast();

  const initialValues: UpdatePaymentMethodData = {
    name: paymentMethod.name,
    code: paymentMethod.code,
    description: paymentMethod.description || "",
    isActive: paymentMethod.isActive,
    requiresConfirmation: paymentMethod.requiresConfirmation,
  };

  const handleSubmit = async (values: UpdatePaymentMethodData) => {
    try {
      // Convert code to uppercase
      const formattedValues = {
        ...values,
        code: values.code?.toUpperCase() || "",
      };

      await paymentMethodsService.update(paymentMethod.id, formattedValues);

      toast({
        title: "Success",
        description: `Payment method "${values.name}" updated successfully`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error updating payment method:", error);

      let errorMessage = "Failed to update payment method";

      if (error.response?.status === 409) {
        errorMessage = "A payment method with this name or code already exists";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      throw error; // Re-throw to let Formik handle the error state
    }
  };

  return (
    <FormikForm
      initialValues={initialValues}
      validationSchema={paymentMethodSchema}
      onSubmit={handleSubmit}
      title="Edit Payment Method"
      onCancel={onCancel}
      submitButtonText="Update Payment Method"
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Name"
          placeholder="e.g., Credit Card, Cash, Mobile Payment"
          required
        />

        <FormikInput
          name="code"
          label="Code"
          placeholder="e.g., CREDIT_CARD, CASH, MOBILE"
          required
          className="font-mono"
        />

        <FormikTextarea
          name="description"
          label="Description"
          placeholder="Optional description of the payment method"
        />

        <div className="space-y-4">
          <FormikSwitch
            name="isActive"
            label="Active"
            description="Enable this payment method for use"
          />

          <FormikSwitch
            name="requiresConfirmation"
            label="Requires Confirmation"
            description="Require manager approval for this payment method"
          />
        </div>
      </div>
    </FormikForm>
  );
}
