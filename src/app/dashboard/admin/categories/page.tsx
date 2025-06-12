"use client";

import React, { useEffect, useState } from "react";
import { CategoriesList } from "@/app/components/CategoriesList";
import { categoriesService, Category } from "@/app/services/categories";
import { CreateCategoryForm } from "@/app/components/CreateCategoryForm";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.listCategories();
      setCategories(data);
      setError(null);
    } catch (err) {
      setError("Failed to load categories. Please try again later.");
      console.error("Error fetching categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchCategories();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={() => setShowCreateForm(true)}
        >
          Add Category
        </button>
      </div>

      <div className="bg-white shadow rounded-lg">
        <CategoriesList
          categories={categories}
          isLoading={isLoading}
          error={error}
        />
      </div>

      {showCreateForm && (
        <CreateCategoryForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
