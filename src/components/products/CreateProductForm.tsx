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
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [barcodeError, setBarcodeError] = useState<string>("");

  const [formData, setFormData] = useState<CreateProductData>({
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

  const resetForm = () => {
    setFormData({
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
    });
    setSelectedCategoryId("");
    setImageUrl("");
    setBarcodeError("");
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
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
      const productData = {
        ...formData,
        businessId: user.business[0].id,
        categoryId: formData.categoryId || undefined,
        subcategoryId: formData.subcategoryId || undefined,
        imageUrl: formData.imageUrl || undefined,
        barcode: formData.barcode || undefined,
        sku: formData.sku || undefined,
      };

      const newProduct = await productsService.create(productData);

      toast({
        title: "Success",
        description: `Product "${newProduct.name}" created successfully`,
      });

      // Clear any previous errors
      setBarcodeError("");

      onSuccess(newProduct);
    } catch (error: any) {
      console.error("Error creating product:", error);

      // Handle specific error types
      let errorMessage = "Failed to create product";

      if (error.response?.status === 409) {
        // Conflict - duplicate barcode or name
        errorMessage =
          error.response?.data?.message ||
          "A product with this barcode or name already exists";

        // Check if it's specifically a barcode error
        if (error.response?.data?.message?.toLowerCase().includes("barcode")) {
          setBarcodeError("This barcode is already in use");
        } else if (
          error.response?.data?.message?.toLowerCase().includes("name")
        ) {
          setBarcodeError(""); // Clear barcode error if it's a name conflict
        } else {
          setBarcodeError(""); // Clear for other conflicts
        }
      } else if (error.response?.status === 400) {
        // Bad request - validation errors
        errorMessage =
          error.response?.data?.message ||
          "Please check your input and try again";
      } else if (error.response?.status === 404) {
        // Not found - business, category, or subcategory not found
        errorMessage =
          error.response?.data?.message ||
          "One or more selected items were not found";
      } else if (error.response?.data?.message) {
        // Use the specific error message from the backend
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter product name"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter product description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={handleInputChange}
              required
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="stock">Stock *</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleInputChange}
              required
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label
              htmlFor="barcode"
              className={barcodeError ? "text-red-600" : ""}
            >
              Barcode {barcodeError && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="barcode"
              name="barcode"
              type="text"
              value={formData.barcode}
              onChange={handleInputChange}
              placeholder="Enter barcode"
              className={
                barcodeError
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : ""
              }
            />
            {barcodeError && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {barcodeError}
              </p>
            )}
            {!barcodeError && formData.barcode && (
              <p className="text-sm text-gray-500 mt-1">
                Barcodes must be unique across all products
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              type="text"
              value={formData.sku}
              onChange={handleInputChange}
              placeholder="Enter SKU"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="subcategoryId">Subcategory</Label>
            <select
              id="subcategoryId"
              name="subcategoryId"
              value={formData.subcategoryId}
              onChange={handleSubcategoryChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedCategoryId}
            >
              <option value="">Select a subcategory</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
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

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                handleCheckboxChange("isActive", checked as boolean)
              }
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="discountable"
              checked={formData.discountable}
              onCheckedChange={(checked) =>
                handleCheckboxChange("discountable", checked as boolean)
              }
            />
            <Label htmlFor="discountable">Discountable</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Product"}
        </Button>
      </div>
    </form>
  );
};
