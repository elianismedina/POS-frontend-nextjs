"use client";

import React, { useState, useEffect } from "react";
import {
  FormikForm,
  FormikInput,
  FormikSelect,
  FormikSwitch,
} from "@/components/shared/FormikForm";
import { waiterSchema } from "@/lib/validation-schemas";
import { createWaiter } from "@/app/services/waiters";
import { BranchesService } from "@/app/services/branches";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";

interface WaiterFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    name: string;
    email: string;
    phone?: string;
    branchId: string;
    isActive: boolean;
  };
}

interface Branch {
  id: string;
  name: string;
  isActive: boolean;
}

export function WaiterForm({
  onSuccess,
  onCancel,
  initialData,
}: WaiterFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);

  const initialValues = {
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    branchId: initialData?.branchId || "",
    isActive: initialData?.isActive ?? true,
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const branchesData = await BranchesService.getMyBusinessBranches();
      setBranches(branchesData);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast({
        title: "Error",
        description: "Failed to load branches",
        variant: "destructive",
      });
    }
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

      const waiterData = {
        email: values.email,
        password: "defaultPassword123", // You might want to add a password field to the form
        name: values.name,
        branchId: values.branchId,
      };

      // For now, we only support creating new waiters
      // If you need to update waiters, you'll need to implement the updateWaiter function in waiters service
      await createWaiter(waiterData);

      toast({
        title: "Success",
        description: "Waiter created successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving waiter:", error);

      let errorMessage = "Failed to save waiter";

      if (error.response?.status === 409) {
        errorMessage = "A waiter with this email already exists";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
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
      validationSchema={waiterSchema}
      onSubmit={handleSubmit}
      title="Create Waiter"
      onCancel={onCancel}
      submitButtonText="Create Waiter"
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Waiter Name"
          placeholder="Enter waiter name"
          required
        />

        <FormikInput
          name="email"
          label="Email"
          type="email"
          placeholder="waiter@example.com"
          required
        />

        <FormikInput name="phone" label="Phone" placeholder="+1234567890" />

        <FormikSelect
          name="branchId"
          label="Branch"
          options={branches.map((branch) => ({
            value: branch.id,
            label: branch.name,
          }))}
          placeholder="Select a branch"
          required
        />

        <FormikSwitch
          name="isActive"
          label="Active"
          description="Enable this waiter for use"
        />
      </div>
    </FormikForm>
  );
}
