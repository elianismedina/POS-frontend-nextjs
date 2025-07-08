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
      setError("No business ID available");
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
      setError("Failed to load taxes. Please try again later.");
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
      setSuccessMessage(`Tax "${data.name}" was created successfully`);
      fetchTaxes();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error("Error creating tax:", err);
      setError("Failed to create tax. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTestTax = async () => {
    if (!businessId) {
      setError("No business ID available");
      return;
    }

    setIsCreating(true);
    try {
      const testTax = await taxesService.createTestTax(businessId);
      setSuccessMessage(`Test tax "${testTax.name}" was created successfully`);
      fetchTaxes();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error("Error creating test tax:", err);
      setError("Failed to create test tax. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Show error if no business ID is available
  if (!businessId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline">
            {" "}
            No business information available. Please contact your
            administrator.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Taxes</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleCreateTestTax}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Test Tax"}
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={isCreating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
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
            Add Tax
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

      {/* Taxes List */}
      <div className="bg-white shadow rounded-lg">
        <TaxesList taxes={taxes} isLoading={isLoading} error={error} />
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Create New Tax
                </h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
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
  );
};

export default TaxesPage;
