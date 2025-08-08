"use client";

import React, { useState, useEffect } from "react";
import {
  FormikForm,
  FormikInput,
  FormikSelect,
  FormikTextarea,
} from "@/components/shared/FormikForm";
import { reservationSchema } from "@/lib/validation-schemas";
import { ReservationsService } from "@/app/services/reservations";
import { CustomersService } from "@/app/services/customers";
import { BranchesService } from "@/app/services/branches";
import { PhysicalTablesService } from "@/app/services/physical-tables";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";

interface ReservationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    customerId: string;
    branchId: string;
    physicalTableId?: string;
    reservationTime: string;
    numberOfGuests: number;
    notes?: string;
  };
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Branch {
  id: string;
  name: string;
}

interface PhysicalTable {
  id: string;
  tableNumber: string;
  tableName?: string;
  capacity: number;
}

export function ReservationForm({
  onSuccess,
  onCancel,
  initialData,
}: ReservationFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [physicalTables, setPhysicalTables] = useState<PhysicalTable[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    initialData?.branchId || ""
  );

  const initialValues = {
    customerId: initialData?.customerId || "",
    branchId: initialData?.branchId || "",
    physicalTableId: initialData?.physicalTableId || "",
    reservationTime: initialData?.reservationTime || "",
    numberOfGuests: initialData?.numberOfGuests || 2,
    notes: initialData?.notes || "",
  };

  useEffect(() => {
    fetchCustomers();
    fetchBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchPhysicalTables(selectedBranchId);
    } else {
      setPhysicalTables([]);
    }
  }, [selectedBranchId]);

  const fetchCustomers = async () => {
    try {
      const customersData = await CustomersService.getCustomersByBusiness();
      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };

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

  const fetchPhysicalTables = async (branchId: string) => {
    try {
      const tablesData = await PhysicalTablesService.getPhysicalTablesByBranch(
        branchId
      );
      setPhysicalTables(tablesData);
    } catch (error) {
      console.error("Error fetching physical tables:", error);
      toast({
        title: "Error",
        description: "Failed to load tables",
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

      const reservationData = {
        customerId: values.customerId,
        branchId: values.branchId,
        physicalTableId: values.physicalTableId || undefined,
        reservationTime: new Date(values.reservationTime).toISOString(),
        numberOfGuests: values.numberOfGuests,
        notes: values.notes || undefined,
        businessId,
      };

      // For now, we only support creating new reservations
      // If you need to update reservations, you'll need to implement the updateReservation method in ReservationsService
      await ReservationsService.createReservation(reservationData);

      toast({
        title: "Success",
        description: "Reservation created successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error saving reservation:", error);

      let errorMessage = "Failed to save reservation";

      if (error.response?.status === 409) {
        errorMessage = "A reservation already exists for this time and table";
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
      validationSchema={reservationSchema}
      onSubmit={handleSubmit}
      title="Create Reservation"
      onCancel={onCancel}
      submitButtonText="Create Reservation"
    >
      <div className="space-y-6">
        <FormikSelect
          name="customerId"
          label="Customer"
          options={customers.map((customer) => ({
            value: customer.id,
            label: `${customer.name} (${customer.email})`,
          }))}
          placeholder="Select a customer"
          required
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

        <FormikSelect
          name="physicalTableId"
          label="Table (Optional)"
          options={physicalTables.map((table) => ({
            value: table.id,
            label: `${table.tableNumber}${
              table.tableName ? ` - ${table.tableName}` : ""
            } (${table.capacity} seats)`,
          }))}
          placeholder="Select a table (optional)"
          disabled={!selectedBranchId}
        />

        <FormikInput
          name="reservationTime"
          label="Reservation Time"
          type="datetime-local"
          required
        />

        <FormikInput
          name="numberOfGuests"
          label="Number of Guests"
          type="number"
          placeholder="2"
          required
        />

        <FormikTextarea
          name="notes"
          label="Notes"
          placeholder="Any special requests or notes"
        />
      </div>
    </FormikForm>
  );
}
