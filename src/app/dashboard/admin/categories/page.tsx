"use client";

import React, { useEffect, useState } from "react";
import { CategoryForm } from "@/components/categories/CategoryForm";
import {
  categoriesService,
  Category,
  CreateCategoryResponse,
} from "@/app/services/categories";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReactivating, setIsReactivating] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const data = await categoriesService.listCategories();
      console.log("Fetched categories:", data);
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

  const handleCreateSuccess = (response: CreateCategoryResponse) => {
    setShowCreateForm(false);
    setSuccessMessage(response.message);
    fetchCategories();

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    setIsDeleting(true);
    try {
      await categoriesService.softDeleteCategory(categoryToDelete.id);
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      setSuccessMessage(
        `Category "${categoryToDelete.name}" was deleted successfully`
      );
      // Refresh the categories list
      fetchCategories();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error deleting category:", err);
      setError("Failed to delete category. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const handleReactivate = async (category: Category) => {
    setIsReactivating(category.id);
    try {
      await categoriesService.reactivateCategory(category.id);
      setSuccessMessage(
        `Category "${category.name}" was reactivated successfully`
      );
      fetchCategories();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error reactivating category:", err);
      setError("Failed to reactivate category. Please try again.");
    } finally {
      setIsReactivating(null);
    }
  };

  const handleDebug = async () => {
    try {
      const debugData = await categoriesService.debugCategories();
      console.log("Debug data:", debugData);
      setSuccessMessage(
        `Debug completed. Check console for details. Total categories: ${debugData.totalCategories}`
      );
    } catch (err) {
      console.error("Error debugging categories:", err);
      setError("Failed to debug categories. Please try again.");
    }
  };

  // Separate active and inactive categories
  const activeCategories = categories.filter((category) => category.isActive);
  const inactiveCategories = categories.filter(
    (category) => !category.isActive
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleDebug}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Debug
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => setShowCreateForm(true)}
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Create New Category
              </h3>
              <CategoryForm onSubmit={handleCreateSuccess} />
              <div className="mt-4">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Delete Category
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete "{categoryToDelete.name}"? This
                action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        {isLoading ? (
          <div className="p-4 text-center">Loading...</div>
        ) : error ? (
          <div className="p-4 text-red-600">{error}</div>
        ) : (
          <div className="p-6">
            {/* Active Categories Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Active Categories ({activeCategories.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-green-200"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error(
                              "Error loading image:",
                              category.imageUrl
                            );
                            e.currentTarget.src = "";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-600 mb-4">
                          {category.description}
                        </p>
                      )}
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            // TODO: Implement edit functionality
                          }}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inactive Categories Section */}
            {inactiveCategories.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Inactive Categories ({inactiveCategories.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inactiveCategories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-red-200 opacity-75"
                    >
                      <div className="relative h-48 bg-gray-200">
                        {category.imageUrl ? (
                          <img
                            src={category.imageUrl}
                            alt={category.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(
                                "Error loading image:",
                                category.imageUrl
                              );
                              e.currentTarget.src = "";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Inactive
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {category.name}
                        </h3>
                        {category.description && (
                          <p className="text-sm text-gray-600 mb-4">
                            {category.description}
                          </p>
                        )}
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleReactivate(category)}
                            disabled={isReactivating === category.id}
                            className="text-green-600 hover:text-green-900 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isReactivating === category.id
                              ? "Reactivating..."
                              : "Reactivate"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Categories Message */}
            {categories.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No categories found. Create your first category to get
                  started.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
