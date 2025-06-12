"use client";

import React, { useEffect, useState } from "react";
import { SubcategoriesList } from "@/app/components/SubcategoriesList";
import { subcategoriesService } from "@/app/services/subcategories";
import { CreateSubcategoryForm } from "../../../components/CreateSubcategoryForm";

interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const SubcategoriesPage = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchSubcategories = async () => {
    try {
      const response = await subcategoriesService.list();
      setSubcategories(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to load subcategories. Please try again later.");
      console.error("Error fetching subcategories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchSubcategories();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subcategories</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={() => setShowCreateForm(true)}
        >
          Add Subcategory
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <SubcategoriesList
          subcategories={subcategories}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {showCreateForm && (
        <CreateSubcategoryForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

export default SubcategoriesPage;
