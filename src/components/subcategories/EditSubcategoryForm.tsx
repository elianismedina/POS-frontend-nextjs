"use client";

import React, { useState, useEffect } from "react";
import {
  FormikForm,
  FormikInput,
  FormikTextarea,
  FormikSelect,
  FormikSwitch,
} from "@/components/shared/FormikForm";
import { subcategorySchema } from "@/lib/validation-schemas";
import { Subcategory } from "@/app/services/subcategories";
import { Category } from "@/app/services/categories";
import { categoriesService } from "@/app/services/categories";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";
import { useToast } from "@/components/ui/use-toast";

interface EditSubcategoryFormProps {
  subcategory: Subcategory;
  onSubmit: (data: {
    name: string;
    description?: string;
    imageUrl?: string;
    isActive?: boolean;
    categoryId: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const EditSubcategoryForm: React.FC<EditSubcategoryFormProps> = ({
  subcategory,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    subcategory.imageUrl || null
  );

  const initialValues = {
    name: subcategory.name,
    description: subcategory.description || "",
    imageUrl: subcategory.imageUrl || "",
    isActive: subcategory.isActive,
    categoryId: subcategory.categoryId,
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoriesService.listCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
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
        categoryId: values.categoryId,
      });
    } catch (error) {
      console.error("Error updating subcategory:", error);
      toast({
        title: "Error",
        description: "Failed to update subcategory",
        variant: "destructive",
      });
    }
  };

  return (
    <FormikForm
      initialValues={initialValues}
      validationSchema={subcategorySchema}
      onSubmit={handleSubmit}
      title="Edit Subcategory"
      onCancel={onCancel}
      submitButtonText={isLoading ? "Updating..." : "Update Subcategory"}
      isLoading={isLoading}
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Subcategory Name"
          placeholder="Enter subcategory name"
          required
        />

        <FormikTextarea
          name="description"
          label="Description"
          placeholder="Enter subcategory description (optional)"
          rows={3}
        />

        <FormikSelect
          name="categoryId"
          label="Category"
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          placeholder="Select a category"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcategory Image
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
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    ×
                  </button>
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
          description="Enable this subcategory for use"
        />
      </div>
    </FormikForm>
  );
};
