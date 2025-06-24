"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { productsService, Product } from "@/app/services/products";
import { EditProductForm } from "@/components/products/EditProductForm";

export default function EditProductPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const productId = params.id as string;

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !user?.id) {
        router.replace("/admin/signin");
        return;
      }
      fetchProduct();
    }
  }, [isAuthenticated, user, router, authLoading, productId]);

  const fetchProduct = async () => {
    try {
      if (!productId) {
        setError("Product ID is required");
        return;
      }

      const productData = await productsService.getById(productId);
      setProduct(productData);
    } catch (error: any) {
      console.error("Error fetching product:", error);
      setError(
        error.response?.data?.message ||
          "Failed to load product. Please try again."
      );
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to load product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSuccess = (updatedProduct: Product) => {
    toast({
      title: "Success",
      description: `Product "${updatedProduct.name}" updated successfully`,
    });
    router.push("/dashboard/admin/products");
  };

  const handleCancel = () => {
    router.push("/dashboard/admin/products");
  };

  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Loading...</h2>
          <p className="text-gray-500">Please wait while we load the product</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Button onClick={() => router.push("/dashboard/admin/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Product Not Found</h2>
          <p className="text-gray-500 mb-6">
            The product you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/dashboard/admin/products")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/admin/products")}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Product: {product.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProductForm
            product={product}
            onSuccess={handleUpdateSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
