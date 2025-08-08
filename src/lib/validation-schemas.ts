import * as Yup from "yup";

// Payment Method Validation Schema
export const paymentMethodSchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .trim(),
  code: Yup.string()
    .required("Code is required")
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must be less than 20 characters")
    .matches(
      /^[A-Z_]+$/,
      "Code must contain only uppercase letters and underscores"
    )
    .trim(),
  description: Yup.string()
    .max(200, "Description must be less than 200 characters")
    .trim(),
  isActive: Yup.boolean().default(true),
  requiresConfirmation: Yup.boolean().default(false),
});

// Category Validation Schema
export const categorySchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  description: Yup.string()
    .max(500, "Description must be less than 500 characters")
    .trim(),
  imageUrl: Yup.string().url("Must be a valid URL").nullable(),
  isActive: Yup.boolean().default(true),
});

// Subcategory Validation Schema
export const subcategorySchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  description: Yup.string()
    .max(500, "Description must be less than 500 characters")
    .trim(),
  imageUrl: Yup.string().url("Must be a valid URL").nullable(),
  categoryId: Yup.string().required("Category is required"),
  isActive: Yup.boolean().default(true),
});

// Product Validation Schema
export const productSchema = Yup.object({
  name: Yup.string()
    .required("Product name is required")
    .min(2, "Product name must be at least 2 characters")
    .max(100, "Product name must be less than 100 characters")
    .trim(),
  description: Yup.string()
    .max(1000, "Description must be less than 1000 characters")
    .trim(),
  price: Yup.number()
    .required("Price is required")
    .min(0, "Price must be greater than or equal to 0")
    .max(999999.99, "Price must be less than 1,000,000"),
  stock: Yup.number()
    .required("Stock is required")
    .min(0, "Stock must be greater than or equal to 0")
    .integer("Stock must be a whole number"),
  barcode: Yup.string()
    .max(50, "Barcode must be less than 50 characters")
    .trim()
    .nullable(),
  sku: Yup.string()
    .max(50, "SKU must be less than 50 characters")
    .trim()
    .nullable(),
  imageUrl: Yup.string().url("Must be a valid URL").nullable(),
  categoryId: Yup.string().nullable(),
  subcategoryId: Yup.string().nullable(),
  isActive: Yup.boolean().default(true),
  discountable: Yup.boolean().default(true),
});

// Branch Validation Schema
export const branchSchema = Yup.object({
  name: Yup.string()
    .required("Branch name is required")
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must be less than 100 characters")
    .trim(),
  address: Yup.string()
    .required("Address is required")
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be less than 200 characters")
    .trim(),
  phone: Yup.string()
    .required("Phone number is required")
    .matches(/^[\+]?[1-9][\d]{0,15}$/, "Must be a valid phone number")
    .trim(),
  email: Yup.string()
    .required("Email is required")
    .email("Must be a valid email address")
    .max(100, "Email must be less than 100 characters")
    .trim(),
  businessId: Yup.string().required("Business is required"),
  isActive: Yup.boolean().default(true),
});

// Tax Validation Schema
export const taxSchema = Yup.object({
  name: Yup.string()
    .required("Tax name is required")
    .min(2, "Tax name must be at least 2 characters")
    .max(100, "Tax name must be less than 100 characters")
    .trim(),
  rate: Yup.number()
    .required("Tax rate is required")
    .min(0, "Tax rate must be greater than or equal to 0")
    .max(100, "Tax rate must be less than or equal to 100"),
  description: Yup.string()
    .max(500, "Description must be less than 500 characters")
    .trim(),
  isActive: Yup.boolean().default(true),
});

// Customer Validation Schema
export const customerSchema = Yup.object({
  name: Yup.string()
    .required("Customer name is required")
    .min(2, "Customer name must be at least 2 characters")
    .max(100, "Customer name must be less than 100 characters")
    .trim(),
  email: Yup.string()
    .email("Must be a valid email address")
    .max(100, "Email must be less than 100 characters")
    .trim()
    .nullable(),
  phone: Yup.string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, "Must be a valid phone number")
    .trim()
    .nullable(),
  address: Yup.string()
    .max(200, "Address must be less than 200 characters")
    .trim()
    .nullable(),
});

// Physical Table Validation Schema
export const physicalTableSchema = Yup.object({
  tableNumber: Yup.string()
    .required("Table number is required")
    .min(1, "Table number must be at least 1 character")
    .max(20, "Table number must be less than 20 characters")
    .trim(),
  tableName: Yup.string()
    .max(100, "Table name must be less than 100 characters")
    .trim()
    .nullable(),
  capacity: Yup.number()
    .required("Capacity is required")
    .min(1, "Capacity must be at least 1")
    .max(50, "Capacity must be less than or equal to 50")
    .integer("Capacity must be a whole number"),
  location: Yup.string()
    .max(100, "Location must be less than 100 characters")
    .trim()
    .nullable(),
  branchId: Yup.string().required("Branch is required"),
  isActive: Yup.boolean().default(true),
});

// Business Settings Validation Schema
export const businessSettingsSchema = Yup.object({
  address: Yup.string()
    .max(200, "Address must be less than 200 characters")
    .trim()
    .nullable(),
  phone: Yup.string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, "Must be a valid phone number")
    .trim()
    .nullable(),
  email: Yup.string()
    .email("Must be a valid email address")
    .max(100, "Email must be less than 100 characters")
    .trim()
    .nullable(),
  taxId: Yup.string()
    .max(50, "Tax ID must be less than 50 characters")
    .trim()
    .nullable(),
  invoiceNumberPrefix: Yup.string()
    .max(10, "Invoice prefix must be less than 10 characters")
    .trim()
    .nullable(),
  invoiceNumberStart: Yup.number()
    .min(1, "Invoice start number must be at least 1")
    .max(999999, "Invoice start number must be less than 1,000,000")
    .integer("Invoice start number must be a whole number")
    .nullable(),
  invoiceNumberEnd: Yup.number()
    .min(1, "Invoice end number must be at least 1")
    .max(999999, "Invoice end number must be less than 1,000,000")
    .integer("Invoice end number must be a whole number")
    .nullable(),
  invoiceExpirationMonths: Yup.number()
    .min(1, "Invoice expiration must be at least 1 month")
    .max(60, "Invoice expiration must be less than or equal to 60 months")
    .integer("Invoice expiration must be a whole number")
    .nullable(),
});

// Waiter Validation Schema
export const waiterSchema = Yup.object({
  name: Yup.string()
    .required("Waiter name is required")
    .min(2, "Waiter name must be at least 2 characters")
    .max(100, "Waiter name must be less than 100 characters")
    .trim(),
  email: Yup.string()
    .required("Email is required")
    .email("Must be a valid email address")
    .max(100, "Email must be less than 100 characters")
    .trim(),
  phone: Yup.string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, "Must be a valid phone number")
    .trim()
    .nullable(),
  branchId: Yup.string().required("Branch is required"),
  isActive: Yup.boolean().default(true),
});

// Reservation Validation Schema
export const reservationSchema = Yup.object({
  customerId: Yup.string().required("Customer is required"),
  branchId: Yup.string().required("Branch is required"),
  physicalTableId: Yup.string().nullable(),
  reservationTime: Yup.date()
    .required("Reservation time is required")
    .min(new Date(), "Reservation time must be in the future"),
  numberOfGuests: Yup.number()
    .required("Number of guests is required")
    .min(1, "Number of guests must be at least 1")
    .max(50, "Number of guests must be less than or equal to 50")
    .integer("Number of guests must be a whole number"),
  notes: Yup.string()
    .max(500, "Notes must be less than 500 characters")
    .trim()
    .nullable(),
});

// Export all schemas
export const validationSchemas = {
  paymentMethod: paymentMethodSchema,
  category: categorySchema,
  subcategory: subcategorySchema,
  product: productSchema,
  branch: branchSchema,
  tax: taxSchema,
  customer: customerSchema,
  physicalTable: physicalTableSchema,
  businessSettings: businessSettingsSchema,
  waiter: waiterSchema,
  reservation: reservationSchema,
};
