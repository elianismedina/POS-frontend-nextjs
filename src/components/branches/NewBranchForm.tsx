"use client";

import React, { useState, useEffect } from "react";
import {
  FormikForm,
  FormikInput,
  FormikSelect,
  FormikSwitch,
} from "@/components/shared/FormikForm";
import { branchSchema } from "@/lib/validation-schemas";
import { BranchesService } from "@/app/services/branches";
import { businessService } from "@/app/services/business";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";

interface NewBranchFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface Business {
  id: string;
  name: string;
  isActive: boolean;
}

export function NewBranchForm({ onSuccess, onCancel }: NewBranchFormProps) {
  const { success, error } = useToast();
  const { user } = useAuth();
  // We'll use the current user's business ID
  const [isLoading, setIsLoading] = useState(false);

  const initialValues = {
    name: "",
    address: "",
    phone: "",
    email: "",
    isActive: true,
  };

  // No need to fetch businesses since we're using the current user's business

  // Since we're creating a branch for the current user's business,
  // we don't need to fetch all businesses
  // The business ID will be obtained from the user context

  const handleSubmit = async (values: any) => {
    if (!user?.business?.[0]?.id) {
      error({
        title: "Error",
        description: "No business ID found",
      });
      return;
    }

    setIsLoading(true);
    try {
      const branchData = {
        ...values,
        businessId: user.business[0].id,
      };

      await BranchesService.createBranch(branchData);

      success({
        title: "Success",
        description: `Branch "${values.name}" created successfully`,
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error creating branch:", error);

      let errorMessage = "Failed to create branch";

      if (error.response?.status === 409) {
        errorMessage = "A branch with this name already exists";
      } else if (error.response?.status === 400) {
        errorMessage = "Please check your input and try again";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      error({
        title: "Error",
        description: errorMessage,
      });

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormikForm
      initialValues={initialValues}
      validationSchema={branchSchema}
      onSubmit={handleSubmit}
      title="Create New Branch"
      onCancel={onCancel}
      submitButtonText="Create Branch"
      isLoading={isLoading}
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Branch Name"
          placeholder="Enter branch name"
          required
        />

        <FormikInput
          name="address"
          label="Address"
          placeholder="Enter branch address"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <FormikInput
            name="phone"
            label="Phone Number"
            placeholder="Enter phone number"
            required
          />

          <FormikInput
            name="email"
            label="Email"
            type="email"
            placeholder="Enter email address"
            required
          />
        </div>

        <FormikSwitch
          name="isActive"
          label="Active"
          description="Enable this branch for use"
        />
      </div>
    </FormikForm>
  );
}
