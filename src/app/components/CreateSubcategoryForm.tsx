"use client";

import React, { useState, useEffect } from "react";
import { subcategoriesService } from "@/app/services/subcategories";
import { categoriesService, Category } from "@/app/services/categories";
import { useToast } from "@/components/ui/use-toast";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";
import Image from "next/image";

interface CreateSubcategoryFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateSubcategoryForm: React.FC<CreateSubcategoryFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesService.listCategories();
        setCategories(response);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories. Please try again.");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleImageUpload = (url: string) => {
    console.log("Image uploaded, URL:", url);
    setImageUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await subcategoriesService.create({
        categoryId,
        name,
        description,
        imageUrl: imageUrl || undefined,
        isActive: true,
      });
      toast({
        title: "Success",
        description: "Subcategory created successfully",
        variant: "default",
      });
      onSuccess();
    } catch (err) {
      setError("Failed to create subcategory. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Create New Subcategory</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
              disabled={isLoadingCategories}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {isLoadingCategories && (
              <p className="mt-1 text-sm text-gray-500">
                Loading categories...
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {imageUrl ? (
                  <div className="relative">
                    <Image
                      src={imageUrl}
                      alt="Preview"
                      width={128}
                      height={128}
                      priority
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
                    buttonText="Upload Image"
                  />
                )}
              </div>
            </div>
          </div>
          {error && <div className="text-red-500">{error}</div>}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isLoadingCategories}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Subcategory"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
