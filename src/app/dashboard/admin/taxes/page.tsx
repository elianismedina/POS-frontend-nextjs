"use client";

import React, { useEffect, useState } from "react";
import { TaxesList } from "@/components/taxes/TaxesList";
import { TaxForm } from "@/components/taxes/TaxForm";
import { taxesService, Tax } from "@/app/services/taxes";
import { useAuth } from "@/lib/auth/AuthContext";

const TaxesPage = () => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user } = useAuth();

  // Get business ID from user context
  const businessId = user?.business?.[0]?.id;

  const fetchTaxes = async () => {
    if (!businessId) {
      setError("No hay ID de negocio disponible");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await taxesService.listTaxes(businessId);
      setTaxes(response);
      setError(null);
    } catch (err) {
      console.error("TaxesPage: Error fetching taxes:", err);
      setError(
        "Error al cargar los impuestos. Por favor, inténtalo de nuevo más tarde."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      fetchTaxes();
    }
  }, [businessId]);

  const handleCreateSuccess = async (data: {
    name: string;
    rate: number;
    description?: string;
    businessId: string;
  }) => {
    setIsCreating(true);
    try {
      await taxesService.createTax(data);
      setShowCreateForm(false);
      setSuccessMessage(`El impuesto "${data.name}" fue creado exitosamente`);
      fetchTaxes();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error("Error creating tax:", err);
      setError("Error al crear el impuesto. Por favor, inténtalo de nuevo.");
    } finally {
      setIsCreating(false);
    }
  };

  // Show error if no business ID is available
  if (!businessId) {
    return (
      <div className="min-h-screen bg-gray-50 pb-12 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong className="font-bold">¡Error!</strong>
            <span className="block sm:inline">
              {" "}
              No hay información de negocio disponible. Por favor, contacta a tu
              administrador.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Impuestos
              </h1>
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                Gestiona las tasas de impuestos y configuraciones de tu negocio
              </p>
            </div>

            {/* Action Buttons - Mobile Stacked, Desktop Horizontal */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={isCreating}
                className="w-full sm:w-auto px-4 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Agregar Impuesto
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Taxes List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <TaxesList taxes={taxes} isLoading={isLoading} error={error} />
        </div>

        {/* Create Form Modal - Mobile Full Screen, Desktop Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Crear Nuevo Impuesto
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors duration-200"
                    aria-label="Cerrar modal"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <TaxForm
                  onSubmit={handleCreateSuccess}
                  onCancel={() => setShowCreateForm(false)}
                  isLoading={isCreating}
                  businessId={businessId}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxesPage;
