"use client";

import React, { useEffect, useState } from "react";
import { SubcategoriesList } from "@/app/components/SubcategoriesList";
import {
  subcategoriesService,
  Subcategory,
  SoftDeleteSubcategoryResponse,
} from "@/app/services/subcategories";
import { CreateSubcategoryForm } from "../../../components/CreateSubcategoryForm";

const SubcategoriesPage = () => {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] =
    useState<Subcategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReactivating, setIsReactivating] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setSuccessMessage("Subcategory created successfully");
    fetchSubcategories();

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const handleDeleteClick = (subcategory: Subcategory) => {
    setSubcategoryToDelete(subcategory);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subcategoryToDelete) return;

    setIsDeleting(true);
    try {
      await subcategoriesService.softDeleteSubcategory(subcategoryToDelete.id);
      setShowDeleteConfirm(false);
      setSubcategoryToDelete(null);
      setSuccessMessage(
        `Subcategory "${subcategoryToDelete.name}" was deleted successfully`
      );
      // Refresh the subcategories list
      fetchSubcategories();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error("Error deleting subcategory:", err);
      setError("Failed to delete subcategory. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSubcategoryToDelete(null);
  };

  const handleReactivate = async (subcategory: Subcategory) => {
    setIsReactivating(subcategory.id);
    try {
      await subcategoriesService.reactivateSubcategory(subcategory.id);
      setSuccessMessage(
        `Subcategory "${subcategory.name}" was reactivated successfully`
      );
      fetchSubcategories();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error reactivating subcategory:", err);
      setError("Failed to reactivate subcategory. Please try again.");
    } finally {
      setIsReactivating(null);
    }
  };

  // Separate active and inactive subcategories
  const activeSubcategories = subcategories.filter(
    (subcategory) => subcategory.isActive
  );
  const inactiveSubcategories = subcategories.filter(
    (subcategory) => !subcategory.isActive
  );

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

      {/* Active Subcategories */}
      {activeSubcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Active Subcategories
          </h2>
          <div className="bg-white shadow rounded-lg">
            <SubcategoriesList
              subcategories={activeSubcategories}
              isLoading={false}
              error={null}
              onDeleteClick={handleDeleteClick}
              onReactivateClick={handleReactivate}
              isDeleting={isDeleting}
              isReactivating={isReactivating}
            />
          </div>
        </div>
      )}

      {/* Inactive Subcategories */}
      {inactiveSubcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Inactive Subcategories
          </h2>
          <div className="bg-white shadow rounded-lg">
            <SubcategoriesList
              subcategories={inactiveSubcategories}
              isLoading={false}
              error={null}
              onDeleteClick={handleDeleteClick}
              onReactivateClick={handleReactivate}
              isDeleting={isDeleting}
              isReactivating={isReactivating}
            />
          </div>
        </div>
      )}

      {/* Show message if no subcategories at all */}
      {subcategories.length === 0 && !isLoading && !error && (
        <div className="bg-white shadow rounded-lg">
          <SubcategoriesList
            subcategories={[]}
            isLoading={false}
            error={null}
          />
        </div>
      )}

      {/* Create Form Modal */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && subcategoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Subcategory
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete "{subcategoryToDelete.name}"? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubcategoriesPage;
