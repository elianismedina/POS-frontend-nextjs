"use client";

import React, { useState } from "react";
import { Category } from "../services/categories";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  const [activeExpanded, setActiveExpanded] = useState(true);
  const [inactiveExpanded, setInactiveExpanded] = useState(true);

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
        <strong className="font-bold">¡Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium text-gray-900">
          No se encontraron categorías
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Comienza creando una nueva categoría.
        </p>
      </div>
    );
  }

  // Separate active and inactive categories
  const activeCategories = categories.filter((cat) => cat.isActive);
  const inactiveCategories = categories.filter((cat) => !cat.isActive);

  const renderCategoryCard = (category: Category, index: number) => (
    <div
      key={category.id}
      className="bg-white p-4 rounded-lg border border-gray-200"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
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
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                {category.name}
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                ID: {category.id}
              </p>
            </div>
            <span
              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                category.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {category.isActive ? "Activa" : "Inactiva"}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {category.description || "Sin descripción"}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Creada: {new Date(category.createdAt).toLocaleDateString()}
          </p>
          <div className="mt-2 flex space-x-2">
            <button
              onClick={() => onEditClick?.(category)}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              Editar
            </button>
            {category.isActive ? (
              <button
                onClick={() => onDeleteClick?.(category)}
                disabled={isDeleting}
                className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            ) : (
              <button
                onClick={() => onReactivateClick?.(category)}
                disabled={isReactivating === category.id}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isReactivating === category.id
                  ? "Reactivando..."
                  : "Reactivar"}
              </button>
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
          <button
            onClick={() => onEditClick?.(category)}
            className="text-blue-600 hover:text-blue-900"
          >
            Editar
          </button>
          {category.isActive ? (
            <button
              onClick={() => onDeleteClick?.(category)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-900 disabled:opacity-50"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </button>
          ) : (
            <button
              onClick={() => onReactivateClick?.(category)}
              disabled={isReactivating === category.id}
              className="text-green-600 hover:text-green-900 disabled:opacity-50"
            >
              {isReactivating === category.id ? "Reactivando..." : "Reactivar"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <>
      {/* Mobile View - Cards */}
      <div className="space-y-6 sm:hidden">
        {/* Active Categories Section */}
        {activeCategories.length > 0 && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveExpanded(!activeExpanded)}
              className="flex items-center justify-between w-full p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {activeExpanded ? (
                  <ChevronDown className="h-5 w-5 text-green-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium text-green-800">
                  Categorías Activas
                </span>
                <span className="bg-green-200 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {activeCategories.length}
                </span>
              </div>
            </button>
            {activeExpanded && (
              <div className="grid gap-4">
                {activeCategories.map((category, index) =>
                  renderCategoryCard(category, index)
                )}
              </div>
            )}
          </div>
        )}

        {/* Inactive Categories Section */}
        {inactiveCategories.length > 0 && (
          <div className="space-y-4">
            <button
              onClick={() => setInactiveExpanded(!inactiveExpanded)}
              className="flex items-center justify-between w-full p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {inactiveExpanded ? (
                  <ChevronDown className="h-5 w-5 text-red-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium text-red-800">
                  Categorías Inactivas
                </span>
                <span className="bg-red-200 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {inactiveCategories.length}
                </span>
              </div>
            </button>
            {inactiveExpanded && (
              <div className="grid gap-4">
                {inactiveCategories.map((category, index) =>
                  renderCategoryCard(category, index)
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden sm:block space-y-6">
        {/* Active Categories Section */}
        {activeCategories.length > 0 && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveExpanded(!activeExpanded)}
              className="flex items-center justify-between w-full p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {activeExpanded ? (
                  <ChevronDown className="h-5 w-5 text-green-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-green-600" />
                )}
                <span className="font-medium text-green-800">
                  Categorías Activas
                </span>
                <span className="bg-green-200 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                  {activeCategories.length}
                </span>
              </div>
            </button>
            {activeExpanded && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Imagen
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Nombre
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Descripción
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Creada
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeCategories.map((category, index) =>
                      renderCategoryRow(category, index)
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Inactive Categories Section */}
        {inactiveCategories.length > 0 && (
          <div className="space-y-4">
            <button
              onClick={() => setInactiveExpanded(!inactiveExpanded)}
              className="flex items-center justify-between w-full p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                {inactiveExpanded ? (
                  <ChevronDown className="h-5 w-5 text-red-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium text-red-800">
                  Categorías Inactivas
                </span>
                <span className="bg-red-200 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                  {inactiveCategories.length}
                </span>
              </div>
            </button>
            {inactiveExpanded && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Imagen
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Nombre
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Descripción
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Estado
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Creada
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {inactiveCategories.map((category, index) =>
                      renderCategoryRow(category, index)
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
