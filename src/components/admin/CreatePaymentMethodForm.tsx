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
  CreatePaymentMethodData,
} from "@/app/services/payment-methods";
import { useToast } from "@/components/ui/use-toast";

interface CreatePaymentMethodFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreatePaymentMethodForm({
  onSuccess,
  onCancel,
}: CreatePaymentMethodFormProps) {
  const { toast } = useToast();

  const initialValues: CreatePaymentMethodData = {
    name: "",
    code: "",
    description: "",
    isActive: true,
    requiresConfirmation: false,
  };

  const handleSubmit = async (values: CreatePaymentMethodData) => {
    try {
      // Convert code to uppercase
      const formattedValues = {
        ...values,
        code: values.code.toUpperCase(),
      };

      await paymentMethodsService.create(formattedValues);

      toast({
        title: "Success",
        description: `Payment method "${values.name}" created successfully`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error creating payment method:", error);

      let errorMessage = "Failed to create payment method";

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
      title="Create Payment Method"
      onCancel={onCancel}
      submitButtonText="Create Payment Method"
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
