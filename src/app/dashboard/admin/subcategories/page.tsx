"use client";

import React, { useEffect, useState } from "react";
import { SubcategoriesList } from "@/app/components/SubcategoriesList";
import {
  subcategoriesService,
  Subcategory,
} from "@/app/services/subcategories";
import { CreateSubcategoryForm } from "../../../components/CreateSubcategoryForm";

const SubcategoriesPage = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchSubcategories = async () => {
    try {
      const response = await subcategoriesService.list();
      setSubcategories(response);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subcategories</h1>
        <button
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          onClick={() => setShowCreateForm(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <CreateSubcategoryForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SubcategoriesPage;
