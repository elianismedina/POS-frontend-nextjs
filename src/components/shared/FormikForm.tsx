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
    <Card className="border-2 border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0 hover:bg-blue-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="w-full sm:w-auto h-12 text-base"
                  disabled={isSubmitting || isLoading}
                >
                  {cancelButtonText}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading || !isValid || !dirty}
                  className="w-full sm:w-auto h-12 text-base"
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
    <Label htmlFor={name} className="text-sm font-medium">
      {label} {required && "*"}
    </Label>
    <Field
      as={Input}
      id={name}
      name={name}
      type={type}
      placeholder={placeholder}
      className={`h-12 text-base ${className}`}
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
    <Label htmlFor={name} className="text-sm font-medium">
      {label} {required && "*"}
    </Label>
    <Field
      as={Textarea}
      id={name}
      name={name}
      placeholder={placeholder}
      rows={rows}
      className="text-base resize-none"
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
    <Label htmlFor={name} className="text-sm font-medium">
      {label} {required && "*"}
    </Label>
    <Field name={name}>
      {({ field, form }: { field: any; form: any }) => (
        <select
          id={name}
          {...field}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-12 text-base"
          onChange={(e) => {
            field.onChange(e);
            if (onChange) {
              onChange(e.target.value);
            }
          }}
        >
          <option value="">{placeholder || "Select an option"}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
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
  <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
    <div className="space-y-1">
      <Label htmlFor={name} className="text-sm font-medium">
        {label}
      </Label>
      {description && (
        <div className="text-xs text-muted-foreground">{description}</div>
      )}
    </div>
    <Field name={name}>
      {({ field, form }: { field: any; form: any }) => (
        <Switch
          checked={field.value}
          onCheckedChange={(checked) => form.setFieldValue(name, checked)}
          className="data-[state=checked]:bg-blue-600"
        />
      )}
    </Field>
  </div>
);

export const FormikCheckbox: React.FC<{
  name: string;
  label: string;
}> = ({ name, label }) => (
  <div className="flex items-center space-x-2">
    <Field name={name}>
      {({ field, form }: { field: any; form: any }) => (
        <Checkbox
          checked={field.value}
          onChange={(e) => form.setFieldValue(name, e.target.checked)}
        />
      )}
    </Field>
    <Label>{label}</Label>
  </div>
);
