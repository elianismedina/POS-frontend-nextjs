import React, { useState } from "react";
import {
  FormikForm,
  FormikInput,
  FormikTextarea,
} from "@/components/shared/FormikForm";
import { categorySchema } from "@/lib/validation-schemas";
import { categoriesService } from "@/app/services/categories";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";
import { useToast } from "@/components/ui/use-toast";

interface CategoryFormProps {
  onSubmit: (data: any) => void;
  initialData?: {
    name: string;
    description?: string;
    imageUrl?: string;
  };
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  onSubmit,
  initialData,
}) => {
  const { success, error } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.imageUrl || null
  );

  const initialValues = {
    name: initialData?.name || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    isActive: true,
  };

  const handleImageUpload = (url: string) => {
    console.log("Image uploaded, URL:", url);
    setPreviewUrl(url);
    // Note: We'll handle this in the form submission
  };

  const handleSubmit = async (values: any) => {
    try {
      console.log("Form submitted with data:", values);

      const response = await categoriesService.createCategory({
        name: values.name,
        description: values.description || undefined,
        imageUrl: previewUrl || values.imageUrl || undefined,
        isActive: true,
      });

      console.log("Category created successfully:", response);

      success({
        title: "Success",
        description: `Category "${values.name}" created successfully`,
      });

      onSubmit(response);
    } catch (error: any) {
      console.error("Error creating category:", error);

      let errorMessage = "Failed to create category";

      if (error.response?.status === 409) {
        errorMessage = "A category with this name already exists";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      error({
        title: "Error",
        description: errorMessage,
      });

      throw error; // Re-throw to let Formik handle the error state
    }
  };

  return (
    <FormikForm
      initialValues={initialValues}
      validationSchema={categorySchema}
      onSubmit={handleSubmit}
      title={initialData ? "Edit Category" : "Create Category"}
      onCancel={() => onSubmit(null)}
      submitButtonText={initialData ? "Update Category" : "Create Category"}
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Name"
          placeholder="Enter category name"
          required
        />

        <FormikTextarea
          name="description"
          label="Description"
          placeholder="Enter category description"
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
};
