"use client";

import React, { useState, useEffect } from "react";
import {
  FormikForm,
  FormikInput,
  FormikTextarea,
  FormikSelect,
  FormikCheckbox,
} from "@/components/shared/FormikForm";
import { productSchema } from "@/lib/validation-schemas";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth/AuthContext";
import { productsService, Product } from "@/app/services/products";
import { categoriesService, Category } from "@/app/services/categories";
import {
  subcategoriesService,
  Subcategory,
} from "@/app/services/subcategories";
import { CloudinaryUploadWidget } from "@/components/shared/CloudinaryUploadWidget";
import { ProductVariants } from "./ProductVariants";

interface CreateProductFormProps {
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  imageUrl?: string;
  barcode?: string;
  discountable: boolean;
  categoryId?: string;
  subcategoryId?: string;
  sku?: string;
}

export const CreateProductForm: React.FC<CreateProductFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  const initialValues: CreateProductData = {
    name: "",
    description: "",
    price: 0,
    stock: 0,
    isActive: true,
    imageUrl: "",
    barcode: "",
    discountable: true,
    categoryId: "",
    subcategoryId: "",
    sku: "",
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
    }
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    try {
      const categoriesData = await categoriesService.listCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showError({
        title: "Error",
        description: "Failed to load categories",
      });
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const subcategoriesData = await subcategoriesService.list(categoryId);
      setSubcategories(subcategoriesData);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      showError({
        title: "Error",
        description: "Failed to load subcategories",
      });
    }
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  const handleSubmit = async (values: CreateProductData) => {
    if (!user?.business?.[0]?.id) {
      showError({
        title: "Error",
        description: "No business ID found",
      });
      return;
    }

    try {
      const productData = {
        ...values,
        businessId: user.business[0].id,
        categoryId: values.categoryId || undefined,
        subcategoryId: values.subcategoryId || undefined,
        imageUrl: imageUrl || values.imageUrl || undefined,
        barcode: values.barcode || undefined,
        sku: values.sku || undefined,
      };

      const newProduct = await productsService.create(productData);
      setCreatedProduct(newProduct);

      success({
        title: "Success",
        description: `Product "${newProduct.name}" created successfully`,
      });
    } catch (error: any) {
      console.error("Error creating product:", error);

      let errorMessage = "Failed to create product";

      if (error.response?.status === 409) {
        errorMessage =
          error.response?.data?.message ||
          "A product with this barcode or name already exists";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          "Please check your input and try again";
      } else if (error.response?.status === 404) {
        errorMessage =
          error.response?.data?.message ||
          "One or more selected items were not found";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showError({
        title: "Error",
        description: errorMessage,
      });

      throw error;
    }
  };

  const handleFinish = () => {
    if (createdProduct) {
      onSuccess(createdProduct);
    }
  };

  // If product was created successfully, show variants section
  if (createdProduct) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Product Created Successfully!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                "{createdProduct.name}" has been created. You can now add
                variants or finish.
              </p>
            </div>
          </div>
        </div>

        <ProductVariants
          productId={createdProduct.id}
          productName={createdProduct.name}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Finish
          </button>
        </div>
      </div>
    );
  }

  return (
    <FormikForm
      initialValues={initialValues}
      validationSchema={productSchema}
      onSubmit={handleSubmit}
      title="Create Product"
      onCancel={onCancel}
      submitButtonText="Create Product"
    >
      <div className="space-y-6">
        <FormikInput
          name="name"
          label="Product Name"
          placeholder="Enter product name"
          required
        />

        <FormikTextarea
          name="description"
          label="Description"
          placeholder="Enter product description"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormikInput
            name="price"
            label="Price"
            type="number"
            placeholder="0.00"
            required
          />

          <FormikInput
            name="stock"
            label="Stock"
            type="number"
            placeholder="0"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormikInput
            name="barcode"
            label="Barcode"
            placeholder="Enter barcode"
          />

          <FormikInput name="sku" label="SKU" placeholder="Enter SKU" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormikSelect
            name="categoryId"
            label="Category"
            options={categories.map((cat) => ({
              value: cat.id,
              label: cat.name,
            }))}
            placeholder="Select a category"
          />

          <FormikSelect
            name="subcategoryId"
            label="Subcategory"
            options={subcategories.map((sub) => ({
              value: sub.id,
              label: sub.name,
            }))}
            placeholder="Select a subcategory"
            disabled={!selectedCategoryId}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Image
          </label>
          <CloudinaryUploadWidget
            onUpload={handleImageUpload}
            uploadPreset="pos-upload-preset"
            buttonText="Upload Product Image"
          />
          {imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt="Product preview"
                className="w-32 h-32 object-cover rounded-md"
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <FormikCheckbox name="isActive" label="Active" />
          <FormikCheckbox name="discountable" label="Discountable" />
        </div>
      </div>
    </FormikForm>
  );
};
