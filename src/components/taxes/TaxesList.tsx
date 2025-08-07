"use client";

import React from "react";
import { Tax } from "@/app/services/taxes";

interface TaxesListProps {
  taxes: Tax[];
  isLoading: boolean;
  error: string | null;
}

export const TaxesList: React.FC<TaxesListProps> = ({
  taxes,
  isLoading,
  error,
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
        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative"
        role="alert"
      >
        <strong className="font-bold">¡Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!taxes || taxes.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No se encontraron impuestos
        </h3>
        <p className="text-sm text-gray-500">
          Comienza creando un nuevo impuesto.
        </p>
      </div>
    );
  }

  const formatRate = (rate: number | undefined | null) => {
    if (rate === undefined || rate === null || isNaN(rate)) {
      return "0.0%";
    }
    return `${(rate * 100).toFixed(1)}%`;
  };

  const formatDecimalRate = (rate: number | undefined | null) => {
    if (rate === undefined || rate === null || isNaN(rate)) {
      return "(0.000)";
    }
    return `(${rate.toFixed(3)})`;
  };

  const formatDate = (date: string | Date) => {
    if (!date) return "N/A";
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      return dateObj.toLocaleDateString();
    } catch (error) {
      return "Fecha Inválida";
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Mobile View - Cards */}
      <div className="block sm:hidden">
        <div className="space-y-4 p-4">
          {taxes.map((tax, index) => {
            const key = tax.id || `tax-${index}`;
            return (
              <div
                key={key}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {tax.name || "Sin nombre"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      ID: {tax.id || "Sin ID"}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {formatRate(tax.rate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDecimalRate(tax.rate)}
                    </div>
                  </div>
                </div>

                {tax.description && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {tax.description}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Creado: {formatDate(tax.createdAt)}</span>
                  <span>Actualizado: {formatDate(tax.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Desktop View - Table */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nombre del Impuesto
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tasa
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Descripción
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Creado
                </th>
                <th
                  scope="col"
                  className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actualizado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taxes.map((tax, index) => {
                const key = tax.id || `tax-${index}`;
                return (
                  <tr
                    key={key}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tax.name || "Sin nombre"}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {tax.id || "Sin ID"}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-semibold">
                        {formatRate(tax.rate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDecimalRate(tax.rate)}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {tax.description || "-"}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tax.createdAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(tax.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
