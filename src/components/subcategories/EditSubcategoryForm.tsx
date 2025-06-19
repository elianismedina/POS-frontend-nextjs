"use client";

import React, { useState, useEffect } from "react";
import { Subcategory } from "@/app/services/subcategories";
import { Category } from "@/app/services/categories";
import { categoriesService } from "@/app/services/categories";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";

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
  const [formData, setFormData] = useState({
    name: subcategory.name,
    description: subcategory.description || "",
    imageUrl: subcategory.imageUrl || "",
    isActive: subcategory.isActive,
    categoryId: subcategory.categoryId,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    subcategory.imageUrl || null
  );

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    imageUrl?: string;
    categoryId?: string;
  }>({});

  useEffect(() => {
    setFormData({
      name: subcategory.name,
      description: subcategory.description || "",
      imageUrl: subcategory.imageUrl || "",
      isActive: subcategory.isActive,
      categoryId: subcategory.categoryId,
    });
    setPreviewUrl(subcategory.imageUrl || null);
    fetchCategories();
  }, [subcategory]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoriesService.listCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleImageUpload = (url: string) => {
    console.log("Image uploaded, URL:", url);
    setFormData((prev) => ({
      ...prev,
      imageUrl: url,
    }));
    setPreviewUrl(url);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrl: "",
    }));
    setPreviewUrl(null);
  };

  const validateForm = () => {
    const newErrors: {
      name?: string;
      description?: string;
      imageUrl?: string;
      categoryId?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = "Please enter a valid URL";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        isActive: formData.isActive,
        categoryId: formData.categoryId,
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      isActive: e.target.checked,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.name ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Enter subcategory name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.description ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Enter subcategory description (optional)"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="categoryId"
          className="block text-sm font-medium text-gray-700"
        >
          Category *
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={formData.categoryId}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.categoryId ? "border-red-300" : "border-gray-300"
          }`}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
        )}
      </div>

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
                folder="subcategories"
                className="w-full"
              />
            )}
          </div>
        </div>
        {errors.imageUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          checked={formData.isActive}
          onChange={handleCheckboxChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
          Active
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Updating..." : "Update Subcategory"}
        </button>
      </div>
    </form>
  );
};
