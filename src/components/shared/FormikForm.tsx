"use client";

import React from "react";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FormikFormProps {
  initialValues: any;
  validationSchema: any;
  onSubmit: (
    values: any,
    formikHelpers: FormikHelpers<any>
  ) => void | Promise<void>;
  title: string;
  onCancel: () => void;
  submitButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const FormikForm: React.FC<FormikFormProps> = ({
  initialValues,
  validationSchema,
  onSubmit,
  title,
  onCancel,
  submitButtonText = "Submit",
  cancelButtonText = "Cancel",
  isLoading = false,
  children,
}) => {
  const { error } = useToast();

  const handleSubmit = async (
    values: any,
    formikHelpers: FormikHelpers<any>
  ) => {
    try {
      await onSubmit(values, formikHelpers);
    } catch (error: any) {
      console.error("Form submission error:", error);

      // Show error toast
      error({
        title: "Error",
        description:
          error.message || "An error occurred while submitting the form",
      });
    }
  };

  return (
    <Card className="border-2 border-gray-200 bg-white shadow-lg">
      <CardHeader className="pb-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({
            isSubmitting,
            isValid,
            dirty,
          }: {
            isSubmitting: boolean;
            isValid: boolean;
            dirty: boolean;
          }) => (
            <Form className="space-y-6">
              {children}

              {/* Mobile-first button layout */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
                <Button
                  type="button"
                  variant="cancel"
                  size="form"
                  onClick={onCancel}
                  className="w-full sm:w-auto"
                  disabled={isSubmitting || isLoading}
                >
                  {cancelButtonText}
                </Button>
                <Button
                  type="submit"
                  variant="submit"
                  size="form"
                  disabled={isSubmitting || isLoading || !isValid || !dirty}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting || isLoading
                    ? "Processing..."
                    : submitButtonText}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
};

// Reusable form field components
export const FormikInput: React.FC<{
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  step?: string;
  min?: string;
  max?: string;
  [key: string]: any; // Allow additional HTML input attributes
}> = ({
  name,
  label,
  placeholder,
  type = "text",
  required = false,
  className = "",
  step,
  min,
  max,
  ...rest
}) => (
  <div className="space-y-3">
    <Label htmlFor={name} className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <Field
      as={Input}
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      className={className}
      step={step}
      min={min}
      max={max}
      {...rest}
    />
    <ErrorMessage
      name={name}
      component="div"
      className="text-sm text-red-600 flex items-center"
    >
      {(msg: string) => (
        <>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {msg}
        </>
      )}
    </ErrorMessage>
  </div>
);

export const FormikTextarea: React.FC<{
  name: string;
  label: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
}> = ({ name, label, placeholder, rows = 4, required = false }) => (
  <div className="space-y-3">
    <Label htmlFor={name} className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <Field
      as={Textarea}
      id={name}
      name={name}
      placeholder={placeholder}
      rows={rows}
    />
    <ErrorMessage
      name={name}
      component="div"
      className="text-sm text-red-600 flex items-center"
    >
      {(msg: string) => (
        <>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {msg}
        </>
      )}
    </ErrorMessage>
  </div>
);

export const FormikSelect: React.FC<{
  name: string;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChange?: (value: string) => void;
}> = ({
  name,
  label,
  options,
  placeholder,
  required = false,
  disabled = false,
  onChange,
}) => (
  <div className="space-y-3">
    <Label htmlFor={name} className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <Field
      as="select"
      id={name}
      name={name}
      disabled={disabled}
      className="flex h-12 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-3 text-base shadow-sm placeholder:text-gray-500 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-400 dark:focus:border-green-400 dark:focus:ring-green-400/20"
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        if (onChange) {
          onChange(e.target.value);
        }
      }}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Field>
    <ErrorMessage
      name={name}
      component="div"
      className="text-sm text-red-600 flex items-center"
    >
      {(msg: string) => (
        <>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {msg}
        </>
      )}
    </ErrorMessage>
  </div>
);

export const FormikSwitch: React.FC<{
  name: string;
  label: string;
  description?: string;
}> = ({ name, label, description }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
        </Label>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <Field
        as={Switch}
        id={name}
        name={name}
        className="data-[state=checked]:bg-green-600"
      />
    </div>
    <ErrorMessage
      name={name}
      component="div"
      className="text-sm text-red-600 flex items-center"
    >
      {(msg: string) => (
        <>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {msg}
        </>
      )}
    </ErrorMessage>
  </div>
);

export const FormikCheckbox: React.FC<{
  name: string;
  label: string;
}> = ({ name, label }) => (
  <div className="space-y-3">
    <div className="flex items-center space-x-2">
      <Field
        as={Checkbox}
        id={name}
        name={name}
        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
      />
      <Label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
    </div>
    <ErrorMessage
      name={name}
      component="div"
      className="text-sm text-red-600 flex items-center"
    >
      {(msg: string) => (
        <>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {msg}
        </>
      )}
    </ErrorMessage>
  </div>
);
