"use client";

import React from "react";
import { Category } from "@/app/services/categories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, RotateCcw } from "lucide-react";

interface CategoriesListProps {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  onDeleteClick?: (category: Category) => void;
  onReactivateClick?: (category: Category) => void;
  onEditClick?: (category: Category) => void;
  isDeleting?: boolean;
  isReactivating?: string | null;
}

export const CategoriesList: React.FC<CategoriesListProps> = ({
  categories,
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
        <div className="text-sm text-gray-500">Loading categories...</div>
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

  if (categories.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">No categories found.</div>
      </div>
    );
  }

  const renderCategoryCard = (category: Category, index: number) => (
    <div
      key={category.id}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
    >
      <div className="flex items-start space-x-4">
        {category.imageUrl ? (
          <div className="relative h-16 w-16 flex-shrink-0">
            <img
              src={category.imageUrl}
              alt={category.name}
              className="h-16 w-16 object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-gray-400 text-xs">Sin imagen</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {category.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {category.description || "Sin descripción"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Creada: {new Date(category.createdAt).toLocaleDateString()}
          </p>
          <div className="mt-2 flex space-x-2">
            <Button
              variant="info"
              size="sm"
              onClick={() => onEditClick?.(category)}
              className="text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
            {category.isActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeleteClick?.(category)}
                disabled={isDeleting}
                className="text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                onClick={() => onReactivateClick?.(category)}
                disabled={isReactivating === category.id}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {isReactivating === category.id
                  ? "Reactivando..."
                  : "Reactivar"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCategoryRow = (category: Category, index: number) => (
    <tr key={category.id}>
      <td className="px-6 py-4 whitespace-nowrap">
        {category.imageUrl ? (
          <div className="relative h-16 w-16">
            <img
              src={category.imageUrl}
              alt={category.name}
              className="h-16 w-16 object-cover rounded-lg"
            />
          </div>
        ) : (
          <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">Sin imagen</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {category.name}
          </div>
          <div className="text-xs text-gray-400 font-mono">{category.id}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {category.description || "-"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            category.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {category.isActive ? "Activa" : "Inactiva"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {new Date(category.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditClick?.(category)}
            className="text-blue-600 hover:text-blue-900 p-0 h-auto"
          >
            Editar
          </Button>
          {category.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteClick?.(category)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-900 p-0 h-auto disabled:opacity-50"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReactivateClick?.(category)}
              disabled={isReactivating === category.id}
              className="text-green-600 hover:text-green-900 p-0 h-auto disabled:opacity-50"
            >
              {isReactivating === category.id ? "Reactivando..." : "Reactivar"}
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
        {categories.map((category, index) =>
          renderCategoryCard(category, index)
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category, index) =>
                renderCategoryRow(category, index)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
