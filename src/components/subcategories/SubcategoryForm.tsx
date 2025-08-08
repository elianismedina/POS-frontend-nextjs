"use client";

import React, { useState, useEffect } from "react";
import {
  FormikForm,
  FormikInput,
  FormikTextarea,
  FormikSelect,
} from "@/components/shared/FormikForm";
import { subcategorySchema } from "@/lib/validation-schemas";
import { subcategoriesService } from "@/app/services/subcategories";
import { categoriesService, Category } from "@/app/services/categories";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";
import { useToast } from "@/components/ui/use-toast";

interface SubcategoryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    imageUrl?: string;
    categoryId: string;
    isActive: boolean;
  };
}

export function SubcategoryForm({
  onSuccess,
  onCancel,
  initialData,
}: SubcategoryFormProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.imageUrl || null
  );

  const initialValues = {
    name: initialData?.name || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    categoryId: initialData?.categoryId || "",
    isActive: initialData?.isActive ?? true,
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoriesService.listCategories();
      setCategories(categoriesData.filter((cat) => cat.isActive));
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

  const handleSubmit = async (values: any) => {
    try {
      console.log("Form submitted with data:", values);

      const subcategoryData = {
        name: values.name,
        description: values.description || undefined,
        imageUrl: previewUrl || values.imageUrl || undefined,
        categoryId: values.categoryId,
        isActive: values.isActive,
      };

      if (initialData) {
        // Update existing subcategory
        if (!initialData.id) {
          throw new Error("Subcategory ID is required for update");
        }
        await subcategoriesService.updateSubcategory(
          initialData.id,
          subcategoryData
        );
        toast({
          title: "Success",
          description: `Subcategory "${values.name}" updated successfully`,
        });
      } else {
        // Create new subcategory
        await subcategoriesService.create(subcategoryData);
        toast({
          title: "Success",
          description: `Subcategory "${values.name}" created successfully`,
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving subcategory:", error);

      let errorMessage = "Failed to save subcategory";

      if (error.response?.status === 409) {
        errorMessage = "A subcategory with this name already exists";
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
      validationSchema={subcategorySchema}
      onSubmit={handleSubmit}
      title={initialData ? "Edit Subcategory" : "Create Subcategory"}
      onCancel={onCancel}
      submitButtonText={
        initialData ? "Update Subcategory" : "Create Subcategory"
      }
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Name"
          placeholder="Enter subcategory name"
          required
        />

        <FormikTextarea
          name="description"
          label="Description"
          placeholder="Enter subcategory description"
        />

        <FormikSelect
          name="categoryId"
          label="Category"
          options={categories.map((cat) => ({
            value: cat.id,
            label: cat.name,
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
                    onClick={() => {
                      setPreviewUrl(null);
                    }}
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
                  buttonText="Upload Image"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </FormikForm>
  );
}
