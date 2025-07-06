"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

interface EditProductData {
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
  const [barcodeError, setBarcodeError] = useState<string>("");

  const [formData, setFormData] = useState<EditProductData>({
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    isActive: product.isActive,
    imageUrl: product.imageUrl,
    barcode: product.barcode,
    discountable: product.discountable,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
  });

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));

    // Clear barcode error when user starts typing
    if (name === "barcode") {
      setBarcodeError("");
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategoryId(categoryId);
    setFormData((prev) => ({
      ...prev,
      categoryId,
      subcategoryId: "", // Reset subcategory when category changes
    }));
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      subcategoryId: e.target.value,
    }));
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
    setFormData((prev) => ({
      ...prev,
      imageUrl: url,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const updatedProduct = await productsService.update(product.id, formData);
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                required
              />
            </div>

            {/* Stock */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
                required
              />
            </div>

            {/* Barcode */}
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                name="barcode"
                type="text"
                value={formData.barcode}
                onChange={handleInputChange}
                placeholder="Enter barcode (optional)"
              />
              {barcodeError && (
                <p className="text-sm text-red-500">{barcodeError}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category (optional)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <select
                id="subcategory"
                value={formData.subcategoryId}
                onChange={handleSubcategoryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!selectedCategoryId}
              >
                <option value="">Select a subcategory (optional)</option>
                {subcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter product description"
              rows={4}
              required
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Product Image</Label>
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

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("isActive", checked as boolean)
                }
              />
              <Label htmlFor="isActive">Product is active</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="discountable"
                checked={formData.discountable}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("discountable", checked as boolean)
                }
              />
              <Label htmlFor="discountable">Product can be discounted</Label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Product"}
            </Button>
          </div>
        </form>
      </div>

      {/* Product Variants Section */}
      <div className="border-t pt-8">
        <ProductVariants productId={product.id} productName={product.name} />
      </div>
    </div>
  );
};
