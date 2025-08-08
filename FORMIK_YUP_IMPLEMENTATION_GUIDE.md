# Formik & Yup Implementation Guide for Admin Dashboard

## Overview
This guide covers the implementation of Formik and Yup for form validation and management in the admin dashboard. The implementation provides consistent form handling, validation, and error management across all admin forms.

## Current Status

### ✅ Already Implemented with Formik & Yup:
- `CreatePaymentMethodForm` - Payment method creation
- `EditPaymentMethodForm` - Payment method editing
- `CategoryForm` - Category creation/editing
- `CreateProductForm` - Product creation
- `EditProductForm` - Product editing
- `TaxForm` - Tax creation/editing
- `SubcategoryForm` - Subcategory creation/editing
- `NewBranchForm` - Branch creation

### 🔄 Forms to Update:
1. **Business Settings Form** (`/admin/business/page.tsx`)
2. **Customer Creation Form** (`/admin/customers/page.tsx`)
3. **Physical Tables Form** (`/admin/physical-tables/page.tsx`)
4. **Waiter Creation Form** (`/admin/waiters/page.tsx`)
5. **Reservation Creation Form** (`/admin/reservations/create/page.tsx`)

## Implementation Pattern

### 1. Validation Schemas
All validation schemas are defined in `/src/lib/validation-schemas.ts`:
- `businessSettingsSchema`
- `customerSchema`
- `physicalTableSchema`
- `waiterSchema`
- `reservationSchema`

### 2. Form Components
Reusable Formik components in `/src/components/shared/FormikForm.tsx`:
- `FormikForm` - Main form wrapper
- `FormikInput` - Text input fields
- `FormikTextarea` - Textarea fields
- `FormikSelect` - Select dropdown fields
- `FormikSwitch` - Toggle switch fields
- `FormikCheckbox` - Checkbox fields

### 3. Form Implementation Pattern

```typescript
import { FormikForm, FormikInput, FormikTextarea } from "@/components/shared/FormikForm";
import { validationSchema } from "@/lib/validation-schemas";
import { service } from "@/app/services/service";

export function MyForm({ onSuccess, onCancel }) {
  const { toast } = useToast();
  
  const initialValues = {
    // form fields
  };

  const handleSubmit = async (values) => {
    try {
      await service.create(values);
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      onSuccess();
    } catch (error) {
      // Error handling
      throw error;
    }
  };

  return (
    <FormikForm
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      title="Form Title"
      onCancel={onCancel}
      submitButtonText="Submit"
    >
      <div className="space-y-6">
        <FormikInput
          name="fieldName"
          label="Field Label"
          placeholder="Placeholder"
          required
        />
        {/* More form fields */}
      </div>
    </FormikForm>
  );
}
```

## Benefits of This Implementation

1. **Consistent Validation**: All forms use the same validation patterns
2. **Better UX**: Real-time validation feedback
3. **Error Handling**: Centralized error management
4. **Accessibility**: Proper form labels and error messages
5. **Mobile Responsive**: Optimized for mobile devices
6. **Type Safety**: Full TypeScript support
7. **Reusability**: Shared components reduce code duplication

## Form Update Checklist

For each form that needs updating:

- [ ] Replace traditional form handling with Formik
- [ ] Use appropriate validation schema
- [ ] Implement proper error handling
- [ ] Add loading states
- [ ] Ensure mobile responsiveness
- [ ] Add proper accessibility attributes
- [ ] Test form submission and validation
- [ ] Update any related components

## Validation Rules

### Common Patterns:
- **Required fields**: `.required("Field is required")`
- **String length**: `.min(2, "Min 2 chars").max(100, "Max 100 chars")`
- **Email**: `.email("Must be valid email")`
- **Phone**: `.matches(/^[\+]?[1-9][\d]{0,15}$/, "Valid phone number")`
- **Numbers**: `.min(0, "Min 0").max(100, "Max 100")`
- **URLs**: `.url("Must be valid URL")`

### Custom Validation:
```typescript
const customSchema = Yup.object({
  field: Yup.string().test(
    'custom-validation',
    'Custom error message',
    (value) => {
      // Custom validation logic
      return true;
    }
  )
});
```

## Error Handling

### Form Level Errors:
```typescript
const handleSubmit = async (values, formikHelpers) => {
  try {
    await service.create(values);
    // Success handling
  } catch (error) {
    // Set form-level errors
    formikHelpers.setFieldError('fieldName', 'Error message');
    // Or set general error
    formikHelpers.setStatus('General error message');
  }
};
```

### Toast Notifications:
```typescript
toast({
  title: "Success",
  description: "Operation completed successfully",
});

toast({
  title: "Error",
  description: "Operation failed",
  variant: "destructive",
});
```

## Testing

### Unit Tests:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyForm } from './MyForm';

describe('MyForm', () => {
  it('should validate required fields', async () => {
    render(<MyForm onSuccess={jest.fn()} onCancel={jest.fn()} />);
    
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Field is required')).toBeInTheDocument();
    });
  });
});
```

## Migration Steps

1. **Identify forms** that need updating
2. **Create/update validation schemas** in `validation-schemas.ts`
3. **Replace form components** with Formik equivalents
4. **Update form handlers** to use Formik patterns
5. **Test thoroughly** with various scenarios
6. **Update related components** if necessary

## Best Practices

1. **Always validate on the frontend** for better UX
2. **Provide clear error messages** that help users fix issues
3. **Use appropriate input types** (email, number, etc.)
4. **Implement proper loading states** during submission
5. **Handle all error scenarios** gracefully
6. **Test on mobile devices** to ensure responsiveness
7. **Follow accessibility guidelines** for screen readers
8. **Keep validation rules consistent** across similar fields

## Common Issues and Solutions

### Issue: Form not submitting
**Solution**: Check that all required fields are filled and validation passes

### Issue: Validation errors not showing
**Solution**: Ensure ErrorMessage components are properly configured

### Issue: Form state not updating
**Solution**: Use `enableReinitialize` prop for dynamic initial values

### Issue: Custom validation not working
**Solution**: Use Yup's `.test()` method for custom validation logic

## Performance Considerations

1. **Debounce validation** for real-time feedback
2. **Lazy load** form components when possible
3. **Optimize re-renders** by using React.memo for form components
4. **Use appropriate validation timing** (onBlur vs onChange)

## Accessibility Features

1. **Proper labels** for all form fields
2. **Error announcements** for screen readers
3. **Keyboard navigation** support
4. **Focus management** during form submission
5. **ARIA attributes** for complex form elements

This implementation provides a robust, consistent, and user-friendly form system for the admin dashboard.
