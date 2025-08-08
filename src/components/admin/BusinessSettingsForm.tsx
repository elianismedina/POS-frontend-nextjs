"use client";

import React, { useState } from "react";
import {
  FormikForm,
  FormikInput,
  FormikTextarea,
} from "@/components/shared/FormikForm";
import { businessSettingsSchema } from "@/lib/validation-schemas";
import { businessService } from "@/app/services/business";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";
import { useToast } from "@/components/ui/use-toast";

interface BusinessSettingsFormProps {
  initialData: {
    address?: string;
    phone?: string;
    email?: string;
    imageUrl?: string;
    taxId?: string;
    invoiceNumberPrefix?: string;
    invoiceNumberStart?: number;
    invoiceNumberEnd?: number;
    invoiceNumberCurrent?: number;
    invoiceExpirationMonths?: number;
    business_id?: string;
    business_name?: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function BusinessSettingsForm({
  initialData,
  onSuccess,
  onCancel,
}: BusinessSettingsFormProps) {
  const { success, error } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.imageUrl || null
  );

  const initialValues = {
    address: initialData?.address || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    taxId: initialData?.taxId || "",
    invoiceNumberPrefix: initialData?.invoiceNumberPrefix || "",
    invoiceNumberStart: initialData?.invoiceNumberStart || 1,
    invoiceNumberEnd: initialData?.invoiceNumberEnd || 999999,
    invoiceNumberCurrent: initialData?.invoiceNumberCurrent || 1,
    invoiceExpirationMonths: initialData?.invoiceExpirationMonths || 12,
    business_name: initialData?.business_name || "",
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (!initialData.business_id) {
        throw new Error("No business ID found");
      }

      // Update business settings
      await businessService.updateSettings(initialData.business_id, {
        address: values.address || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        image_url: imageUrl || values.imageUrl || undefined,
        tax_id: values.taxId || undefined,
        invoice_number_prefix: values.invoiceNumberPrefix || undefined,
        invoice_number_start: values.invoiceNumberStart || undefined,
        invoice_number_end: values.invoiceNumberEnd || undefined,
        invoice_number_current: values.invoiceNumberCurrent || undefined,
        invoice_expiration_months: values.invoiceExpirationMonths || undefined,
      });

      // Update business name if provided
      if (
        values.business_name &&
        values.business_name !== initialData.business_name
      ) {
        await businessService.updateBusiness(initialData.business_id, {
          name: values.business_name,
        });
      }

      success({
        title: "Success",
        description: "Business settings updated successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error("Error updating business settings:", error);

      let errorMessage = "Failed to update business settings";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      error({
        title: "Error",
        description: errorMessage,
      });

      throw error;
    }
  };

  return (
    <FormikForm
      initialValues={initialValues}
      validationSchema={businessSettingsSchema}
      onSubmit={handleSubmit}
      title="Business Settings"
      onCancel={onCancel}
      submitButtonText="Save Settings"
    >
      <div className="space-y-6">
        <FormikInput
          name="business_name"
          label="Business Name"
          placeholder="Enter business name"
        />

        <FormikInput
          name="email"
          label="Email"
          type="email"
          placeholder="business@example.com"
        />

        <FormikInput name="phone" label="Phone" placeholder="+1234567890" />

        <FormikTextarea
          name="address"
          label="Address"
          placeholder="Enter business address"
        />

        <FormikInput
          name="taxId"
          label="Tax ID"
          placeholder="Enter tax identification number"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormikInput
            name="invoiceNumberPrefix"
            label="Invoice Prefix"
            placeholder="INV"
          />

          <FormikInput
            name="invoiceNumberStart"
            label="Invoice Start Number"
            type="number"
            placeholder="1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormikInput
            name="invoiceNumberEnd"
            label="Invoice End Number"
            type="number"
            placeholder="999999"
          />

          <FormikInput
            name="invoiceNumberCurrent"
            label="Current Invoice Number"
            type="number"
            placeholder="1"
          />
        </div>

        <FormikInput
          name="invoiceExpirationMonths"
          label="Invoice Expiration (Months)"
          type="number"
          placeholder="12"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Logo
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt="Business logo"
                    className="h-32 w-32 object-cover rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <CloudinaryUploadWidget
                  onUpload={handleImageUpload}
                  uploadPreset="pos-upload-preset"
                  buttonText="Upload Logo"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </FormikForm>
  );
}
