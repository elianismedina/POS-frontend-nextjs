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
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.rate.trim()) {
      newErrors.rate = "La tasa es requerida";
    } else {
      const rate = parseFloat(formData.rate);
      if (isNaN(rate)) {
        newErrors.rate = "La tasa debe ser un número válido";
      } else if (rate < 0) {
        newErrors.rate = "La tasa no puede ser negativa";
      } else if (rate > 100) {
        newErrors.rate = "La tasa no puede exceder el 100%";
      }
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description =
        "La descripción debe tener menos de 500 caracteres";
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Nombre del Impuesto *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className={`block w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
            errors.name ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="ej., IVA, Impuesto de Ventas"
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-2 text-sm text-red-600">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="rate"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Tasa de Impuesto (%) *
        </label>
        <div className="relative">
          <input
            type="text"
            id="rate"
            name="rate"
            value={formData.rate}
            onChange={handleRateChange}
            className={`block w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
              errors.rate ? "border-red-300" : "border-gray-300"
            }`}
            placeholder="ej., 16.0"
            aria-describedby={errors.rate ? "rate-error" : "rate-help"}
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <span className="text-gray-500 text-base">%</span>
          </div>
        </div>
        {errors.rate && (
          <p id="rate-error" className="mt-2 text-sm text-red-600">
            {errors.rate}
          </p>
        )}
        <p id="rate-help" className="mt-2 text-xs text-gray-500">
          Ingresa un valor entre 0 y 100 (ej., 16.0 para 16%)
        </p>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className={`block w-full px-4 py-3 text-base border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
            errors.description ? "border-red-300" : "border-gray-300"
          }`}
          placeholder="Descripción opcional del impuesto"
          aria-describedby={
            errors.description ? "description-error" : undefined
          }
        />
        {errors.description && (
          <p id="description-error" className="mt-2 text-sm text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      {/* Mobile-first button layout */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? "Creando..." : "Crear Impuesto"}
        </button>
      </div>
    </form>
  );
};
