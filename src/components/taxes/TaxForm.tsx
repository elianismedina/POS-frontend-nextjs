"use client";

import React from "react";
import {
  FormikForm,
  FormikInput,
  FormikTextarea,
  FormikSwitch,
} from "@/components/shared/FormikForm";
import { taxSchema } from "@/lib/validation-schemas";
import { taxesService } from "@/app/services/taxes";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";

interface TaxFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id?: string;
    name: string;
    rate: number;
    description?: string;
    isActive: boolean;
  };
}

export function TaxForm({ onSuccess, onCancel, initialData }: TaxFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const initialValues = {
    name: initialData?.name || "",
    rate: initialData?.rate || 0,
    description: initialData?.description || "",
    isActive: initialData?.isActive ?? true,
  };

  const handleSubmit = async (values: any) => {
    if (!user?.business?.[0]?.id) {
      toast({
        title: "Error",
        description: "No business ID found",
        variant: "destructive",
      });
      return;
    }

    try {
      const taxData = {
        ...values,
        businessId: user.business[0].id,
      };

      if (initialData) {
        // Update existing tax
        if (!initialData.id) {
          throw new Error("Tax ID is required for update");
        }
        await taxesService.update(initialData.id, taxData);
        toast({
          title: "Success",
          description: `Tax "${values.name}" updated successfully`,
        });
      } else {
        // Create new tax
        await taxesService.createTax(taxData);
        toast({
          title: "Success",
          description: `Tax "${values.name}" created successfully`,
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving tax:", error);

      let errorMessage = "Failed to save tax";

      if (error.response?.status === 409) {
        errorMessage = "A tax with this name already exists";
      } else if (error.response?.status === 400) {
        errorMessage = "Please check your input and try again";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
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
      validationSchema={taxSchema}
      onSubmit={handleSubmit}
      title={initialData ? "Edit Tax" : "Create Tax"}
      onCancel={onCancel}
      submitButtonText={initialData ? "Update Tax" : "Create Tax"}
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Tax Name"
          placeholder="Enter tax name"
          required
        />

        <FormikInput
          name="rate"
          label="Tax Rate (%)"
          type="number"
          placeholder="0.00"
          required
        />

        <FormikTextarea
          name="description"
          label="Description"
          placeholder="Enter tax description"
        />

        <FormikSwitch
          name="isActive"
          label="Active"
          description="Enable this tax for use"
        />
      </div>
    </FormikForm>
  );
}
