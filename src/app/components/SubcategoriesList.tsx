"use client";

import React from "react";
import Image from "next/image";
import { Subcategory } from "@/app/services/subcategories";

interface SubcategoriesListProps {
  subcategories: Subcategory[];
  isLoading: boolean;
  error: string | null;
  onDeleteClick?: (subcategory: Subcategory) => void;
  onReactivateClick?: (subcategory: Subcategory) => void;
  isDeleting?: boolean;
  isReactivating?: string | null;
}

export const SubcategoriesList: React.FC<SubcategoriesListProps> = ({
  subcategories,
  isLoading,
  error,
  onDeleteClick,
  onReactivateClick,
  isDeleting = false,
  isReactivating = null,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!subcategories || subcategories.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-900">
          No subcategories found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new subcategory.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Mobile View - Cards */}
      <div className="grid gap-4 sm:hidden">
        {subcategories.map((subcategory) => (
          <div
            key={subcategory.id}
            className="bg-white p-4 rounded-lg border border-gray-200"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {subcategory.imageUrl ? (
                  <div className="relative h-16 w-16">
                    <Image
                      src={subcategory.imageUrl}
                      alt={subcategory.name}
                      fill
                      sizes="(max-width: 64px) 100vw, 64px"
                      className="object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {subcategory.name}
                  </h3>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      subcategory.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {subcategory.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {subcategory.description || "No description"}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Created:{" "}
                  {new Date(subcategory.createdAt).toLocaleDateString()}
                </p>
                <div className="mt-2 flex space-x-2">
                  {subcategory.isActive ? (
                    <button
                      onClick={() => onDeleteClick?.(subcategory)}
                      disabled={isDeleting}
                      className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivateClick?.(subcategory)}
                      disabled={isReactivating === subcategory.id}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {isReactivating === subcategory.id
                        ? "Reactivating..."
                        : "Reactivate"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Image
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created At
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subcategories.map((subcategory) => (
              <tr key={subcategory.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {subcategory.imageUrl ? (
                    <div className="relative h-16 w-16">
                      <Image
                        src={subcategory.imageUrl}
                        alt={subcategory.name}
                        fill
                        sizes="(max-width: 64px) 100vw, 64px"
                        className="object-cover rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No image</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {subcategory.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subcategory.description || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      subcategory.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {subcategory.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(subcategory.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subcategory.isActive ? (
                    <button
                      onClick={() => onDeleteClick?.(subcategory)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  ) : (
                    <button
                      onClick={() => onReactivateClick?.(subcategory)}
                      disabled={isReactivating === subcategory.id}
                      className="text-green-600 hover:text-green-900 disabled:opacity-50"
                    >
                      {isReactivating === subcategory.id
                        ? "Reactivating..."
                        : "Reactivate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
