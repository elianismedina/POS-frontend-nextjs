"use client";

import React, { useState } from "react";
import {
  FormikForm,
  FormikInput,
  FormikTextarea,
  FormikSwitch,
} from "@/components/shared/FormikForm";
import { categorySchema } from "@/lib/validation-schemas";
import { Category } from "@/app/services/categories";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";
import { useToast } from "@/components/ui/use-toast";

interface EditCategoryFormProps {
  category: Category;
  onSubmit: (data: {
    name: string;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EditCategoryForm: React.FC<EditCategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { error: showError } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    category.imageUrl || null
  );

  const initialValues = {
    name: category.name,
    description: category.description || "",
    imageUrl: category.imageUrl || "",
    isActive: category.isActive,
  };

  const handleImageUpload = (url: string) => {
    console.log("Image uploaded, URL:", url);
    setPreviewUrl(url);
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
  };

  const handleSubmit = async (values: any) => {
    try {
      await onSubmit({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        imageUrl: previewUrl || values.imageUrl.trim() || undefined,
        isActive: values.isActive,
      });
    } catch (error) {
      console.error("Error updating category:", error);
      showError({
        title: "Error",
        description: "Failed to update category",
      });
    }
  };

  return (
    <FormikForm
      initialValues={initialValues}
      validationSchema={categorySchema}
      onSubmit={handleSubmit}
      title="Edit Category"
      onCancel={onCancel}
      submitButtonText={isLoading ? "Updating..." : "Update Category"}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Category Name"
          placeholder="Enter category name"
          required
        />

        <FormikTextarea
          name="description"
          label="Description"
          placeholder="Enter category description (optional)"
          rows={3}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-lg mx-auto"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
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
                  <div className="mt-2">
                    <CloudinaryUploadWidget
                      onUpload={handleImageUpload}
                      uploadPreset="pos-upload-preset"
                      buttonText="Replace Image"
                    />
                  </div>
                </div>
              ) : (
                <CloudinaryUploadWidget
                  onUpload={handleImageUpload}
                  uploadPreset="pos-upload-preset"
                  buttonText="Upload Image"
                />
              )}
            </div>
          </div>
        </div>

        <FormikSwitch
          name="isActive"
          label="Active"
          description="Enable this category for use"
        />
      </div>
    </FormikForm>
  );
};
