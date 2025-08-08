"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  productsService,
  ProductVariant,
  CreateProductVariantData,
} from "@/app/services/products";
import { Plus, Edit, Trash2, X, Check } from "lucide-react";

interface ProductVariantsProps {
  productId: string;
  productName: string;
}

interface VariantFormData {
  name: string;
  description: string;
  price: number;
  sku: string;
  isActive: boolean;
}

export const ProductVariants: React.FC<ProductVariantsProps> = ({
  productId,
  productName,
}) => {
  const { toast } = useToast();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<VariantFormData>({
    name: "",
    description: "",
    price: 0,
    sku: "",
    isActive: true,
  });

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      setIsLoading(true);
      const variantsData = await productsService.getProductVariants(productId);
      setVariants(variantsData);
    } catch (error) {
      console.error("Error fetching variants:", error);
      toast({
        title: "Error",
        description: "Failed to load product variants",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      sku: "",
      isActive: true,
    });
    setEditingVariant(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      name: variant.name,
      description: variant.description || "",
      price: variant.price,
      sku: variant.sku || "",
      isActive: variant.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm("Are you sure you want to delete this variant?")) {
      return;
    }

    try {
      await productsService.deleteProductVariant(productId, variantId);
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      toast({
        title: "Success",
        description: "Variant deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting variant:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete variant",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const variantData: CreateProductVariantData = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        sku: formData.sku || undefined,
        isActive: formData.isActive,
      };

      if (editingVariant) {
        // Update existing variant
        const updatedVariant = await productsService.updateProductVariant(
          productId,
          editingVariant.id,
          variantData
        );
        setVariants((prev) =>
          prev.map((v) => (v.id === editingVariant.id ? updatedVariant : v))
        );
        toast({
          title: "Success",
          description: `Variant "${updatedVariant.name}" updated successfully`,
        });
      } else {
        // Create new variant
        const newVariant = await productsService.createProductVariant(
          productId,
          variantData
        );
        setVariants((prev) => [...prev, newVariant]);
        toast({
          title: "Success",
          description: `Variant "${newVariant.name}" created successfully`,
        });
      }

      handleCancel();
    } catch (error: any) {
      console.error("Error saving variant:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save variant",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading variants...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <p className="text-sm text-gray-600">
            Manage variants for "{productName}"
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </Button>
      </div>

      {/* Variants List */}
      {variants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No variants yet
              </h4>
              <p className="text-gray-500 mb-4">
                Add variants like sizes, colors, or other options for this
                product.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Variant
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {variants.map((variant) => (
            <Card key={variant.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {variant.name}
                      </h4>
                      <Badge
                        variant={variant.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {variant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {variant.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {variant.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        Price:{" "}
                        <span className="font-medium">
                          ${variant.price.toFixed(2)}
                        </span>
                      </span>
                      {variant.sku && (
                        <span className="text-gray-600">
                          SKU:{" "}
                          <span className="font-medium">{variant.sku}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(variant)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(variant.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">
                  {editingVariant ? "Edit Variant" : "Add New Variant"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Variant Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Small, Red, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Optional description"
                    rows={2}
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
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      name="sku"
                      type="text"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="Optional SKU"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleCheckboxChange("isActive", e.target.checked)
                    }
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Saving..."
                    ) : editingVariant ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Update Variant
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variant
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
