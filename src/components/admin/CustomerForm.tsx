"use client";

import React from "react";
import {
  FormikForm,
  FormikInput,
  FormikTextarea,
} from "@/components/shared/FormikForm";
import { customerSchema } from "@/lib/validation-schemas";
import { CustomersService } from "@/app/services/customers";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";

interface CustomerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    documentNumber?: string;
  };
}

export function CustomerForm({
  onSuccess,
  onCancel,
  initialData,
}: CustomerFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const initialValues = {
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    documentNumber: initialData?.documentNumber || "",
  };

  const handleSubmit = async (values: any) => {
    try {
      // Get business ID from user
      const businessId = user?.business?.[0]?.id;
      if (!businessId) {
        toast({
          title: "Error",
          description: "No business ID found",
          variant: "destructive",
        });
        return;
      }

      const createData = {
        ...values,
        businessId,
      };

      await CustomersService.createCustomer(createData);

      toast({
        title: "Success",
        description: "Customer created successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error creating customer:", error);

      let errorMessage = "Failed to create customer";

      if (error.response?.status === 409) {
        errorMessage =
          "A customer with this email or document number already exists";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  };

  return (
    <FormikForm
      initialValues={initialValues}
      validationSchema={customerSchema}
      onSubmit={handleSubmit}
      title={initialData ? "Edit Customer" : "Create Customer"}
      onCancel={onCancel}
      submitButtonText={initialData ? "Update Customer" : "Create Customer"}
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Customer Name"
          placeholder="Enter customer name"
          required
        />

        <FormikInput
          name="email"
          label="Email"
          type="email"
          placeholder="customer@example.com"
        />

        <FormikInput name="phone" label="Phone" placeholder="+1234567890" />

        <FormikTextarea
          name="address"
          label="Address"
          placeholder="Enter customer address"
        />

        <FormikInput
          name="documentNumber"
          label="Document Number"
          placeholder="Enter document number"
        />
      </div>
    </FormikForm>
  );
}
