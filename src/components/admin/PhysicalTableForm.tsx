"use client";

import React, { useState, useEffect } from "react";
import {
  FormikForm,
  FormikInput,
  FormikSelect,
  FormikSwitch,
} from "@/components/shared/FormikForm";
import { physicalTableSchema } from "@/lib/validation-schemas";
import { PhysicalTablesService } from "@/app/services/physical-tables";
import { BranchesService } from "@/app/services/branches";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";

interface PhysicalTableFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    tableNumber: string;
    tableName?: string;
    capacity: number;
    location?: string;
    branchId: string;
    isActive: boolean;
  };
}

interface Branch {
  id: string;
  name: string;
  isActive: boolean;
}

export function PhysicalTableForm({
  onSuccess,
  onCancel,
  initialData,
}: PhysicalTableFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);

  const initialValues = {
    tableNumber: initialData?.tableNumber || "",
    tableName: initialData?.tableName || "",
    capacity: initialData?.capacity || 4,
    location: initialData?.location || "",
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
      let businessId = "";

      if (user?.business?.[0]?.id) {
        businessId = user.business[0].id;
      } else if (user?.branch?.business?.id) {
        businessId = user.branch.business.id;
      }

      if (!businessId || !values.branchId) {
        throw new Error("Business or branch information not available");
      }

      const createData = {
        tableNumber: values.tableNumber,
        tableName: values.tableName || undefined,
        capacity: values.capacity,
        location: values.location || undefined,
        businessId,
        branchId: values.branchId,
        isActive: values.isActive,
      };

      if (initialData) {
        // Update existing table
        await PhysicalTablesService.updatePhysicalTable(
          initialData.tableNumber, // Assuming we have an ID field
          createData
        );
      } else {
        // Create new table
        await PhysicalTablesService.createPhysicalTable(createData);
      }

      toast({
        title: "Success",
        description: initialData
          ? "Physical table updated successfully"
          : "Physical table created successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving physical table:", error);

      let errorMessage = "Failed to save physical table";

      if (error.response?.data?.message) {
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
      validationSchema={physicalTableSchema}
      onSubmit={handleSubmit}
      title={initialData ? "Edit Physical Table" : "Create Physical Table"}
      onCancel={onCancel}
      submitButtonText={initialData ? "Update Table" : "Create Table"}
    >
      <div className="space-y-6">
        <FormikInput
          name="tableNumber"
          label="Table Number"
          placeholder="e.g., T01, T02"
          required
        />

        <FormikInput
          name="tableName"
          label="Table Name"
          placeholder="e.g., Window Table, Corner Table"
        />

        <FormikInput
          name="capacity"
          label="Capacity"
          type="number"
          placeholder="4"
          required
        />

        <FormikInput
          name="location"
          label="Location"
          placeholder="e.g., Main Floor, Patio, VIP Area"
        />

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
          description="Enable this table for use"
        />
      </div>
    </FormikForm>
  );
}
