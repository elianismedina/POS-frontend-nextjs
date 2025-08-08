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

interface EditProductFormProps {
  product: Product;
  onSuccess: (product: Product) => void;
  onCancel: () => void;
}

export const EditProductForm: React.FC<EditProductFormProps> = ({
  product,
  onSuccess,
  onCancel,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    product.categoryId || ""
  );
  const [imageUrl, setImageUrl] = useState<string>(product.imageUrl || "");

  const initialValues = {
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    isActive: product.isActive,
    imageUrl: product.imageUrl || "",
    barcode: product.barcode || "",
    discountable: product.discountable,
    categoryId: product.categoryId || "",
    subcategoryId: product.subcategoryId || "",
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
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const subcategoriesData = await subcategoriesService.list(categoryId);
      setSubcategories(subcategoriesData);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      toast({
        title: "Error",
        description: "Failed to load subcategories",
        variant: "destructive",
      });
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
  };

  const handleSubmit = async (values: any) => {
    if (!user?.business?.[0]?.id) {
      toast({
        title: "Error",
        description: "No business ID found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedProduct = await productsService.update(product.id, {
        ...values,
        imageUrl: imageUrl || values.imageUrl,
      });
      onSuccess(updatedProduct);
    } catch (error: any) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Product Form */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Product Details</h3>
        <FormikForm
          initialValues={initialValues}
          validationSchema={productSchema}
          onSubmit={handleSubmit}
          title="Edit Product"
          onCancel={onCancel}
          submitButtonText={isLoading ? "Updating..." : "Update Product"}
          isLoading={isLoading}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormikInput
                name="name"
                label="Product Name"
                placeholder="Enter product name"
                required
              />

              <FormikInput
                name="price"
                label="Price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />

              <FormikInput
                name="stock"
                label="Stock Quantity"
                type="number"
                min="0"
                placeholder="0"
                required
              />

              <FormikInput
                name="barcode"
                label="Barcode"
                placeholder="Enter barcode (optional)"
              />

              <FormikSelect
                name="categoryId"
                label="Category"
                options={categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                }))}
                placeholder="Select a category (optional)"
                onChange={(value) => handleCategoryChange(value)}
              />

              <FormikSelect
                name="subcategoryId"
                label="Subcategory"
                options={subcategories.map((subcategory) => ({
                  value: subcategory.id,
                  label: subcategory.name,
                }))}
                placeholder="Select a subcategory (optional)"
                disabled={!selectedCategoryId}
              />
            </div>

            <FormikTextarea
              name="description"
              label="Description"
              placeholder="Enter product description"
              rows={4}
              required
            />

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

            <div className="space-y-4">
              <FormikCheckbox name="isActive" label="Product is active" />

              <FormikCheckbox
                name="discountable"
                label="Product can be discounted"
              />
            </div>
          </div>
        </FormikForm>
      </div>

      {/* Product Variants Section */}
      <div className="border-t pt-8">
        <ProductVariants productId={product.id} productName={product.name} />
      </div>
    </div>
  );
};
