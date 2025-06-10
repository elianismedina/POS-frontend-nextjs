"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";

interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const { isAuthenticated, token, user } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token || !user?.business?.id) {
      router.push("/signin");
      return;
    }

    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get("/categories", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            businessId: user.business.id,
          },
        });
        console.log("Categories response:", response.data);
        setCategories(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [isAuthenticated, token, router, user?.business?.id]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Categories</CardTitle>
          <Button
            onClick={() => router.push("/dashboard/admin/categories/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <DataTable columns={columns} data={categories} loading={loading} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
