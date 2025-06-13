import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";
import { categoriesService } from "@/app/services/categories";

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
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: initialData,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.imageUrl || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (url: string) => {
    console.log("Image uploaded, URL:", url);
    setValue("imageUrl", url);
    setPreviewUrl(url);
  };

  const onSubmitForm = async (data: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    console.log("Form submitted with data:", data);
    try {
      const response = await categoriesService.createCategory({
        name: data.name,
        description: data.description || undefined,
        imageUrl: data.imageUrl || undefined,
        isActive: true,
      });
      console.log("Category created successfully:", response);
      onSubmit(response);
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          {...register("name", { required: "Name is required" })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register("description")}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

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
                    setValue("imageUrl", "");
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

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting
          ? "Creating..."
          : initialData
          ? "Update Category"
          : "Create Category"}
      </button>
    </form>
  );
};
