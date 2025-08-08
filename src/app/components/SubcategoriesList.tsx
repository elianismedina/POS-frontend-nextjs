"use client";

import React from "react";
import { Subcategory } from "@/app/services/subcategories";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, RotateCcw } from "lucide-react";
import Image from "next/image";

interface SubcategoriesListProps {
  subcategories: Subcategory[];
  isLoading: boolean;
  error: string | null;
  onDeleteClick?: (subcategory: Subcategory) => void;
  onReactivateClick?: (subcategory: Subcategory) => void;
  onEditClick?: (subcategory: Subcategory) => void;
  isDeleting?: boolean;
  isReactivating?: string | null;
}

export const SubcategoriesList: React.FC<SubcategoriesListProps> = ({
  subcategories,
  isLoading,
  error,
  onDeleteClick,
  onReactivateClick,
  onEditClick,
  isDeleting = false,
  isReactivating = null,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading subcategories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-red-500">{error}</div>
      </div>
    );
  }

  if (subcategories.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">No subcategories found.</div>
      </div>
    );
  }

  const renderSubcategoryCard = (subcategory: Subcategory, index: number) => (
    <div
      key={subcategory.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
    >
      <div className="flex items-start space-x-4">
        {subcategory.imageUrl ? (
          <div className="relative h-16 w-16 flex-shrink-0">
            <Image
              src={subcategory.imageUrl}
              alt={subcategory.name}
              fill
              sizes="(max-width: 64px) 100vw, 64px"
              priority={index === 0}
              className="object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-gray-400 text-xs">No image</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {subcategory.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {subcategory.description || "No description"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Created: {new Date(subcategory.createdAt).toLocaleDateString()}
          </p>
          <div className="mt-2 flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditClick?.(subcategory)}
              className="text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            {subcategory.isActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteClick?.(subcategory)}
                disabled={isDeleting}
                className="text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onReactivateClick?.(subcategory)}
                disabled={isReactivating === subcategory.id}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {isReactivating === subcategory.id
                  ? "Reactivating..."
                  : "Reactivate"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubcategoryRow = (subcategory: Subcategory, index: number) => (
    <tr key={subcategory.id}>
      <td className="px-6 py-4 whitespace-nowrap">
        {subcategory.imageUrl ? (
          <div className="relative h-16 w-16">
            <Image
              src={subcategory.imageUrl}
              alt={subcategory.name}
              fill
              sizes="(max-width: 64px) 100vw, 64px"
              priority={index === 0}
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
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditClick?.(subcategory)}
            className="text-blue-600 hover:text-blue-900 p-0 h-auto"
          >
            Edit
          </Button>
          {subcategory.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteClick?.(subcategory)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-900 p-0 h-auto disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReactivateClick?.(subcategory)}
              disabled={isReactivating === subcategory.id}
              className="text-green-600 hover:text-green-900 p-0 h-auto disabled:opacity-50"
            >
              {isReactivating === subcategory.id
                ? "Reactivating..."
                : "Reactivate"}
            </Button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Mobile/Tablet View - Cards */}
      <div className="grid gap-4 md:hidden">
        {subcategories.map((subcategory, index) =>
          renderSubcategoryCard(subcategory, index)
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subcategories.map((subcategory, index) =>
                renderSubcategoryRow(subcategory, index)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
