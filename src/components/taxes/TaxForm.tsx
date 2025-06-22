"use client";

import React, { useState } from "react";

interface TaxFormProps {
  onSubmit: (data: {
    name: string;
    rate: number;
    description?: string;
    businessId: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
  businessId: string;
}

export const TaxForm: React.FC<TaxFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  businessId,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    rate: "",
    description: "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    rate?: string;
    description?: string;
  }>({});

  const validateForm = () => {
    const newErrors: {
      name?: string;
      rate?: string;
      description?: string;
    } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.rate.trim()) {
      newErrors.rate = "Rate is required";
    } else {
      const rate = parseFloat(formData.rate);
      if (isNaN(rate)) {
        newErrors.rate = "Rate must be a valid number";
      } else if (rate < 0) {
        newErrors.rate = "Rate cannot be negative";
      } else if (rate > 100) {
        newErrors.rate = "Rate cannot exceed 100%";
      }
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert percentage to decimal for backend
      const ratePercentage = parseFloat(formData.rate);
      const rateDecimal = ratePercentage / 100;

      onSubmit({
        name: formData.name.trim(),
        rate: rateDecimal, // Send as decimal (0.08 for 8%)
        description: formData.description.trim() || undefined,
        businessId,
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Allow empty string or valid percentage (0-100)
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      const numValue = parseFloat(value);
      if (value === "" || (numValue >= 0 && numValue <= 100)) {
        setFormData((prev) => ({
          ...prev,
          rate: value,
        }));
        if (errors.rate) {
          setErrors((prev) => ({
            ...prev,
            rate: undefined,
          }));
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Tax Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.name ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="e.g., VAT, Sales Tax"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="rate"
          className="block text-sm font-medium text-gray-700"
        >
          Tax Rate (%) *
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            id="rate"
            name="rate"
            value={formData.rate}
            onChange={handleRateChange}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.rate ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="e.g., 16.0"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">%</span>
          </div>
        </div>
        {errors.rate && (
          <p className="mt-1 text-sm text-red-600">{errors.rate}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Enter a value between 0 and 100 (e.g., 16.0 for 16%)
        </p>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.description ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Optional description of the tax"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? "Creating..." : "Create Tax"}
        </button>
      </div>
    </form>
  );
};
